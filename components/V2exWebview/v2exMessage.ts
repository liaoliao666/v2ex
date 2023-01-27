import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { noop, pick, uniqueId } from 'lodash-es'

import { sleep } from '@/utils/sleep'

class SendMEssageTimeoutError extends Error {
  constructor() {
    super('请检查您的网络设置')
    this.name = '应用连接失败'
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
            'transformResponseScript',
          ]),
        })
        this.linsteners.set(id, resolve)
      }).finally(() => {
        this.timeout = false
        this.linsteners.delete(id)
      }),
      sleep(config.timeout || 5 * 1000).then(() =>
        Promise.reject(new SendMEssageTimeoutError())
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
    if (diffMins < 3) return this.checkConnectPromise

    this.checkConnectTimeElapsed = Date.now()
    this.checkConnectPromise = this.injectCheckConnectScript().catch(() => {
      this.reloadWebview()
    })

    return this.checkConnectPromise
  }
}

export default new V2exMessage()
