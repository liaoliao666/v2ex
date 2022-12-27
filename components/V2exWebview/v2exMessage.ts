import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { noop, pick, uniqueId } from 'lodash-es'

import { timeout } from '@/utils/timeout'

class V2exMessage {
  linsteners: Map<string, (response: any) => void> = new Map()
  loadedV2exWebviewPromise: Promise<void> = Promise.resolve()
  inject: (arg: { id: string; config: AxiosRequestConfig }) => void = noop
  clear: () => void = noop
  reload: () => void = noop

  constructor() {
    this.sendMessage = this.sendMessage.bind(this)
  }

  async sendMessage(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<any, any>> {
    await this.loadedV2exWebviewPromise

    const id = uniqueId()

    return timeout(
      new Promise<AxiosResponse<any, any>>(async resolve => {
        const pickedConfig = pick(config, [
          'timeout',
          'baseURL',
          'responseType',
          'method',
          'url',
          'headers',
          'withCredentials',
          'data',
        ])

        this.linsteners.set(id, resolve)

        this.inject({
          id,
          config: pickedConfig,
        })
      }).finally(() => this.linsteners.delete(id)),
      10 * 1000
    )
  }
}

export default new V2exMessage()
