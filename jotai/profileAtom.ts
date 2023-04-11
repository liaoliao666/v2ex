import { Profile } from '@/servicies/types'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const profileAtom = atomWithAsyncStorage<Profile | null>('profile', null)
