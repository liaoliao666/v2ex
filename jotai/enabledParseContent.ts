import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 是否内容解析
 */
export const enabledParseContentAtom = atomWithAsyncStorage<boolean>(
  'enabledParseContent',
  true
)
