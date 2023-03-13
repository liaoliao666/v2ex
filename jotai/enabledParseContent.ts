import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 是否内容解析
 */
export const enabledParseContentAtom = atomWithStorage<boolean>(
  'enabledParseContent',
  true,
  storage
)
