import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export const cookieAtom = atomWithStorage<string | null>(
  'cookie',
  null,
  storage
)
