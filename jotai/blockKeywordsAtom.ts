import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const topicTitleBlockKeywordsAtom = atomWithAsyncStorage<string[]>(
  'topicTitleBlockKeywords',
  []
)

export const blockedNodeNamesAtom = atomWithAsyncStorage<string[]>(
  'blockedNodeNames',
  []
)

export const blockKeywordsAtom = topicTitleBlockKeywordsAtom
