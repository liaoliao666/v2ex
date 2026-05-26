import { uniqBy } from 'lodash-es'

import { Topic } from '@/servicies'

export type TopicBlockReason =
  | {
      type: 'keyword'
      value: string
      label: string
    }
  | {
      type: 'node'
      value: string
      label: string
    }

export type BlockedTopic = {
  topic: Topic
  reasons: TopicBlockReason[]
  reasonText: string
}

export type TopicBlockRules = {
  keywords: string[]
  nodeNames: string[]
  getNodeTitle?: (nodeName: string) => string | undefined
}

export type SplitTopicsByBlockRulesResult = {
  visibleTopics: Topic[]
  blockedTopics: BlockedTopic[]
}

export function normalizeKeyword(keyword: string) {
  return keyword.trim()
}

export function normalizeKeywordForMatch(keyword: string) {
  return normalizeKeyword(keyword).toLocaleLowerCase()
}

export function normalizeNodeName(nodeName: string) {
  return nodeName.trim()
}

export function splitTopicsByBlockRules(
  topics: Topic[],
  { keywords, nodeNames, getNodeTitle }: TopicBlockRules
): SplitTopicsByBlockRulesResult {
  const normalizedKeywords = uniqBy(
    keywords.map(normalizeKeyword).filter(Boolean),
    normalizeKeywordForMatch
  )
  const normalizedNodeNames = uniqBy(
    nodeNames.map(normalizeNodeName).filter(Boolean),
    nodeName => nodeName
  )

  if (!normalizedKeywords.length && !normalizedNodeNames.length) {
    return {
      visibleTopics: topics,
      blockedTopics: [],
    }
  }

  const keywordMatchers = normalizedKeywords.map(keyword => ({
    keyword,
    matchedText: normalizeKeywordForMatch(keyword),
  }))
  const blockedNodeNameSet = new Set(normalizedNodeNames)

  const visibleTopics: Topic[] = []
  const blockedTopics: BlockedTopic[] = []
  const blockedTopicIds = new Set<number>()

  topics.forEach(topic => {
    const titleForMatch = (topic.title || '').toLocaleLowerCase()
    const nodeName = topic.node?.name
    const reasons: TopicBlockReason[] = keywordMatchers
      .filter(({ matchedText }) => titleForMatch.includes(matchedText))
      .map(({ keyword }) => ({
        type: 'keyword' as const,
        value: keyword,
        label: `关键字 ${keyword}`,
      }))

    if (nodeName && blockedNodeNameSet.has(nodeName)) {
      reasons.push({
        type: 'node',
        value: nodeName,
        label: `节点 ${
          getNodeTitle?.(nodeName) || topic.node?.title || nodeName
        }`,
      })
    }

    if (!reasons.length) {
      visibleTopics.push(topic)
      return
    }

    if (!blockedTopicIds.has(topic.id)) {
      blockedTopicIds.add(topic.id)
      blockedTopics.push({
        topic,
        reasons,
        reasonText: reasons.map(reason => reason.label).join('、'),
      })
    }
  })

  return {
    visibleTopics,
    blockedTopics,
  }
}
