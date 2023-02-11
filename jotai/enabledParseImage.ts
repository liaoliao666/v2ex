import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 是否图片解析
 */
export const enabledParseImageAtom = atomWithStorage<boolean>(
  'enabledParseImage',
  true,
  storage
)
