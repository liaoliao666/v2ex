import { atomWithStorage } from 'jotai/utils'

import { Profile } from '@/servicies/types'

import { storage } from './storage'

export const profileAtom = atomWithStorage<Profile | null>(
  'profile',
  null,
  storage
)
