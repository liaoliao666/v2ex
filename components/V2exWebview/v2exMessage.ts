import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { noop, pick, uniqueId } from 'lodash-es'

import { sleep } from '@/utils/sleep'

class SendMEssageTimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SendMEssageTimeoutError'
  }
}

class V2exMessage {
  linsteners: Map<string, (response: any) => void> = new Map()
  loadV2exWebviewPromise: Promise<void> = Promise.resolve()
  timeout: boolean = false
  injectRequestScript: (arg: {
    id: string
    config: AxiosRequestConfig
  }) => void = noop
  clearWebviewCache: () => void = noop
  reloadWebview: () => void = () => Promise.resolve()

  injectCheckConnectScript: () => Promise<void> = () => Promise.resolve()
  checkConnectPromise: Promise<void> = Promise.resolve()
  checkConnectTimeElapsed: number = 0

  constructor() {
    this.sendMessage = this.sendMessage.bind(this)
    this.checkConnect = this.checkConnect.bind(this)
  }

  async sendMessage(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<any, any>> {
    await this.loadV2exWebviewPromise

    const id = uniqueId()

    return Promise.race([
      new Promise<AxiosResponse<any, any>>(async resolve => {
        this.injectRequestScript({
          id,
          config: pick(config, [
            'timeout',
            'baseURL',
            'responseType',
            'method',
            'url',
            'headers',
            'withCredentials',
            'data',
          ]),
        })
        this.linsteners.set(id, resolve)
      }).finally(() => {
        this.timeout = false
        this.linsteners.delete(id)
      }),
      sleep(5 * 1000).then(() =>
        Promise.reject(new SendMEssageTimeoutError('timeout'))
      ),
    ])
      .catch(async err => {
        if (err instanceof SendMEssageTimeoutError) {
          await this.checkConnect()
          this.timeout = true
        }
        return Promise.reject(err)
      })
      .finally(() => this.linsteners.delete(id))
  }

  private async checkConnect() {
    const diffMins = (Date.now() - this.checkConnectTimeElapsed) / 1000 / 60
    if (diffMins < 5) return this.checkConnectPromise

    this.checkConnectTimeElapsed = Date.now()
    this.checkConnectPromise = this.injectCheckConnectScript().catch(() => {
      this.reloadWebview()
    })

    return this.checkConnectPromise
  }
}

export default new V2exMessage()
