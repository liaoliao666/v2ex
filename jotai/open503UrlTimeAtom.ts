import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 今天是否打开了503页面
 */
export const open503UrlTimeAtom = atomWithStorage<number>(
  'open503UrlTime',
  0,
  storage
)
