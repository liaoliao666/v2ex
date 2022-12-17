/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { z } from 'zod'

import { Sov2exArgs } from './servicies/sov2ex'
import { Node } from './servicies/types'

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
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
  SearchOptions: {
    defaultValues: z.infer<typeof Sov2exArgs>
    onSubmit: (values: z.infer<typeof Sov2exArgs>) => void
  }
  SearchNode: {
    onNodeItemPress: (node: Node) => void
  }
  Login: undefined
  TopicDetail: {
    id: number
    initialScrollIndex?: number
  }
  RelatedReplies: {
    replyIndex: number
    onReply: (username: string) => void
    topicId: number
  }
  NodeTopics: {
    name: string
  }
  MemberDetail: {
    username: string
  }
  WriteTopic: undefined
  NavNodes: undefined
  GItHubMD: {
    url: string
    title: string
  }
}

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>
