import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 是否启动自动签到
 */
export const enabledAutoCheckinAtom = atomWithStorage<boolean>(
  'enabledAutoCheckin',
  true,
  storage
)
