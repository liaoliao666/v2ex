import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 是否启动自动签到
 */
export const enabledAutoCheckinAtom = atomWithAsyncStorage<boolean>(
  'enabledAutoCheckin',
  true
)
