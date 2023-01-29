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
  loadingV2exWebview: boolean = true
  injectRequestScript: (arg: {
    id: string
    config: AxiosRequestConfig
  }) => void = noop
  clearWebviewCache: () => void = noop
  reloadWebview: () => void = () => Promise.resolve()
  login: (arg: {
    username: string
    password: string
    code: string
  }) => Promise<void> = () => Promise.resolve()
  isLimitLogin: () => Promise<boolean> = () => Promise.resolve(false)
  timeout: boolean = false
  injectCheckConnectScript: () => Promise<void> = () => Promise.resolve()
  checkConnectPromise: Promise<void> = Promise.resolve()
  checkingConnect: boolean = false
  checkConnectTimeElapsed: number = 0

  constructor() {
    this.sendMessage = this.sendMessage.bind(this)
    this.checkConnect = this.checkConnect.bind(this)
  }

  async sendMessage(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<any, any>> {
    await this.checkConnect()

    const id = uniqueId()

    try {
      return await Promise.race([
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
        }),
        sleep(config.timeout || 5 * 1000).then(() =>
          Promise.reject(new SendMEssageTimeoutError())
        ),
      ])
    } catch (error) {
      if (error instanceof SendMEssageTimeoutError) {
        this.timeout = true
      }
      return Promise.reject(error)
    } finally {
      this.linsteners.delete(id)
    }
  }

  async checkConnect() {
    if (this.loadingV2exWebview) return this.loadV2exWebviewPromise

    if (this.checkingConnect) return this.checkConnectPromise

    this.checkingConnect = true
    this.checkConnectPromise = this.injectCheckConnectScript().catch(() =>
      this.reloadWebview()
    )
    this.checkConnectPromise.finally(() => {
      this.checkingConnect = false
    })

    return this.checkConnectPromise
  }
}

export default new V2exMessage()
