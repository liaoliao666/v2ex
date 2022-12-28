import { sleep } from '@tanstack/query-core/build/lib/utils'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { noop, pick, uniqueId } from 'lodash-es'

class V2exMessage {
  linsteners: Map<string, (response: any) => void> = new Map()
  loadV2exWebviewPromise: Promise<void> = Promise.resolve()
  timeout: boolean = false
  inject: (arg: { id: string; config: AxiosRequestConfig }) => void = noop
  clear: () => void = noop
  reload: () => void = noop

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
      })
        .then(res => {
          this.timeout = false
          return res
        })
        .finally(() => this.linsteners.delete(id)),
      sleep(10 * 1000).then(() => {
        this.timeout = true
        throw new Error('Timeout')
      }),
    ])
  }
}

export default new V2exMessage()
