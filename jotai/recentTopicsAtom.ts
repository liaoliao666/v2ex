import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export interface RecentTopic {
  member: {
    username: string
    avatar: string
  }
  id: number
  title: string
}

/**
 * 最近浏览节点
 */
export const recentTopicsAtom = atomWithAsyncStorage<RecentTopic[]>(
  'recentTopics',
  []
)
