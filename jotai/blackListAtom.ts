import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export type HomeTab = {
  title: string
  key: string
}

export const blackListAtom = atomWithStorage<{
  ignoredTopics: number[]
  blockers: number[]
}>(
  'blackList',
  {
    ignoredTopics: [],
    blockers: [],
  },
  storage
)
