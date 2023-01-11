import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

// 模拟注销帐号
export const deletedNamesAtom = atomWithStorage<string[]>(
  'deletedNames',
  [],
  storage
)
