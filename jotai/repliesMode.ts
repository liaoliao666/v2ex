import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export type RepliesMode = 'default' | 'smart' | 'reverse'

export const repliesModeAtom = atomWithAsyncStorage<RepliesMode>(
  'repliesMode',
  'default'
)
