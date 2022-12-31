import { sleep } from './sleep'

export function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    sleep(ms).then(() =>
      Promise.reject(new Error('Timeout after ' + ms + ' ms'))
    ),
  ])
}
