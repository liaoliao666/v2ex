import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export const open503UrlTimeAtom = atomWithStorage<number>(
  'open503UrlTime',
  0,
  storage
)
