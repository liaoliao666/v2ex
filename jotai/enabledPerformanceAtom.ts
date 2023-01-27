import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 是否开启性能模式
 */
export const enabledPerformanceAtom = atomWithStorage<boolean>(
  'enabledPerformance',
  false,
  storage
)
