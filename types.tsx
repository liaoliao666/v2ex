/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import { Member, Node, Topic } from './servicies/types'

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    transformResponseScript?: string
  }
}

export type RootStackParamList = {
  Root: undefined
  SortTabs: undefined
  NotFound: undefined
  MyNodes: undefined
  MyTopics: undefined
  MyFollowing: undefined
  Notifications: undefined
  Search: undefined
  SearchOptions: undefined
  SearchNode: {
    onPressNodeItem: (node: Node) => void
  }
  SearchReplyMember: {
    topicId: number
    onPressReplyMemberItem: (member: Member) => void
  }
  Login: undefined
  TopicDetail: Partial<Topic> & { hightlightReplyNo?: number; id: number }
  RelatedReplies: {
    replyId: number
    onReply: (username: string) => void
    topicId: number
  }
  NodeTopics: {
    name: string
  }
  MemberDetail: {
    username: string
  }
  WriteTopic: {
    topic?: Topic
  }
  NavNodes: undefined
  GItHubMD: {
    url: string
    title: string
  }
  WebSignin: {
    once: string
    onTwoStepOnce: (once: string) => void
  }
  RecentTopic: undefined
  Setting: undefined
  Rank: undefined
}

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>
