import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export interface RecentTopic {
  member: {
    username: string
    avatar: string
  }
  id: number
  title: string
}

export const recentTopicsAtom = atomWithStorage<RecentTopic[]>(
  'recentTopics',
  [],
  storage
)
