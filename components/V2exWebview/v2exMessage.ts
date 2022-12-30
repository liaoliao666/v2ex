import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { noop, pick, uniqueId } from 'lodash-es'

import { sleep } from '@/utils/sleep'

class V2exMessage {
  linsteners: Map<string, (response: any) => void> = new Map()
  loadV2exWebviewPromise: Promise<void> = Promise.resolve()
  timeout: boolean = false
  injectRequestScript: (arg: {
    id: string
    config: AxiosRequestConfig
  }) => void = noop
  clearWebviewCache: () => void = noop
  reloadWebview: () => void = noop

  constructor() {
    this.sendMessage = this.sendMessage.bind(this)
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
      sleep(5 * 1000).then(() => {
        this.timeout = true
        this.linsteners.delete(id)
        throw new Error('Timeout')
      }),
    ])
  }
}

export default new V2exMessage()
