import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 模拟注销帐号
 */
export const deletedNamesAtom = atomWithAsyncStorage<string[]>(
  'deletedNames',
  []
)
