import { useAtomValue } from 'jotai'
import { useCallback, useMemo } from 'react'

import {
  blockedNodeNamesAtom,
  topicTitleBlockKeywordsAtom,
} from '@/jotai/blockKeywordsAtom'
import { Node, Topic, k } from '@/servicies'

import { splitTopicsByBlockRules } from './topicBlocking'

export function useTopicBlockRules(topics: Topic[]) {
  const keywords = useAtomValue(topicTitleBlockKeywordsAtom)
  const nodeNames = useAtomValue(blockedNodeNamesAtom)

  const { data: nodeTitleMap = {} } = k.node.all.useQuery({
    select: useCallback(
      (nodes: Node[]) =>
        Object.fromEntries(nodes.map(node => [node.name, node.title])),
      []
    ),
  })

  return useMemo(
    () =>
      splitTopicsByBlockRules(topics, {
        keywords,
        nodeNames,
        getNodeTitle: nodeName => nodeTitleMap[nodeName],
      }),
    [keywords, nodeNames, nodeTitleMap, topics]
  )
}
