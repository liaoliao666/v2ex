import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 今天是否打开了503页面
 */
export const open503UrlTimeAtom = atomWithAsyncStorage<number>(
  'open503UrlTime',
  0
)
