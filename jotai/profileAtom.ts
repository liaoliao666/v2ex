import { Profile } from '@/servicies'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const profileAtom = atomWithAsyncStorage<Profile | null>('profile', null)
