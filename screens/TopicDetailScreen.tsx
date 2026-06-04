import { Entypo, Feather } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue, useSetAtom } from 'jotai'
import { last } from 'lodash-es'
import {
  Fragment,
  memo,
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Empty from '@/components/Empty'
import IconButton from '@/components/IconButton'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicDetailPlaceholder from '@/components/placeholder/TopicDetailPlaceholder'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import ReplyBox, { ReplyInfo } from '@/components/topic/ReplyBox'
import ReplyItem from '@/components/topic/ReplyItem'
import TopicInfo, {
  LikeTopic,
  ThankTopic,
  VoteButton,
} from '@/components/topic/TopicInfo'
import { RepliesMode, repliesModeAtom } from '@/jotai/repliesMode'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Reply, Topic, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import { isSelf } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import {
  getReplyReferences,
  hasExplicitReplyReference,
} from '@/utils/replyReference'
import { BizError } from '@/utils/request'
import tw from '@/utils/tw'
import useMount from '@/utils/useMount'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

type ReplyListEntry = {
  reply: Reply
  collapsed: boolean
}

const REPLY_LIST_PERFORMANCE_PROPS = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 32,
  windowSize: 9,
  removeClippedSubviews: Platform.OS === 'android',
} as const

const REPLY_MODE_OPTIONS = [
  { label: '默认', value: 'default' },
  { label: '智能', value: 'smart' },
  { label: '最新', value: 'reverse' },
] as {
  label: string
  value: RepliesMode | 'reverse'
}[]

type TopicReplyListItemProps = {
  item: ReplyListEntry
  topicId: number
  once?: string
  hightlight?: boolean
  showNestedReply: boolean
  showLegacyUi: boolean
  onToggleCollapse: (replyId: number) => void
  onReply: (username: string, replyNo?: number) => void
}

const TopicReplyListItem = memo(
  function TopicReplyListItem({
    item,
    topicId,
    once,
    hightlight,
    showNestedReply,
    showLegacyUi,
    onToggleCollapse,
    onReply,
  }: TopicReplyListItemProps) {
    const { reply, collapsed } = item
    const handleToggleCollapse = useCallback(() => {
      onToggleCollapse(reply.id)
    }, [onToggleCollapse, reply.id])

    return (
      <ReplyItem
        reply={reply}
        topicId={topicId}
        once={once}
        hightlight={hightlight}
        showNestedReply={showNestedReply}
        showLegacyUi={showLegacyUi}
        collapsed={collapsed}
        onToggleCollapse={
          showNestedReply && reply.reply_has_nested_children
            ? handleToggleCollapse
            : undefined
        }
        onReply={onReply}
      />
    )
  },
  (prev, next) =>
    prev.item.reply === next.item.reply &&
    prev.item.collapsed === next.item.collapsed &&
    prev.topicId === next.topicId &&
    prev.once === next.once &&
    prev.hightlight === next.hightlight &&
    prev.showNestedReply === next.showNestedReply &&
    prev.showLegacyUi === next.showLegacyUi &&
    prev.onToggleCollapse === next.onToggleCollapse &&
    prev.onReply === next.onReply
)

function keyExtractor(item: ReplyListEntry) {
  return String(item.reply.id)
}

const TopicDetailHeader = memo(function TopicDetailHeader({
  topic,
  orderBy,
  showLoading,
  onAppend,
  onOrderByChange,
}: {
  topic: Topic
  orderBy: RepliesMode | 'reverse'
  showLoading: boolean
  onAppend: () => void
  onOrderByChange: (value: RepliesMode | 'reverse') => void
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <TopicInfo topic={topic} onAppend={onAppend}>
      <View
        style={tw.style(
          `flex-row items-center pt-3 mt-2 border-t border-solid border-[${colors.divider}]`
        )}
      >
        <Text style={tw`text-[${colors.foreground}] ${fontSize.medium}`}>
          全部回复
        </Text>
        {showLoading && (
          <StyledActivityIndicator size="small" style={tw`ml-2`} />
        )}

        <RadioButtonGroup
          style={tw`ml-auto`}
          options={REPLY_MODE_OPTIONS}
          value={orderBy}
          onChange={onOrderByChange}
        />
      </View>
    </TopicInfo>
  )
})

export default withQuerySuspense(TopicDetailScreen, {
  LoadingComponent: () => {
    const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()
    return (
      <TopicDetailPlaceholder topic={params}>
        <TopicPlaceholder />
      </TopicDetailPlaceholder>
    )
  },
  FallbackComponent: props => {
    const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()
    return (
      <TopicDetailPlaceholder topic={params} isError>
        <FallbackComponent {...props} />
      </TopicDetailPlaceholder>
    )
  },
})

function TopicDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()
  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = k.topic.detail.useSuspenseInfiniteQuery({
    variables: { id: params.id },
  })

  useMount(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)
  const topic = last(data?.pages)!
  const setRepliesMode = useSetAtom(repliesModeAtom)
  const [orderBy, setOrderBy] = useState<RepliesMode | 'reverse'>(
    () => store.get(repliesModeAtom) ?? 'default'
  )
  const rawReplies = useMemo(() => {
    const seenReplyIds = new Set<number>()
    const replies: Reply[] = []

    data?.pages.forEach(page => {
      page.replies.forEach(reply => {
        if (seenReplyIds.has(reply.id)) return

        seenReplyIds.add(reply.id)
        replies.push(reply)
      })
    })

    return replies
  }, [data?.pages])
  const flatedData = useMemo(() => {
    const rawList = rawReplies
    let _flatedData: Reply[] = []

    if (orderBy === 'smart') {
      const ascList = rawList
      const replyMap = new Map<number, Reply>()
      const parentMap = new Map<number, number>()
      ascList.forEach(reply => {
        replyMap.set(reply.id, {
          ...reply,
          children: [],
          reply_level: 0,
          is_merged: false,
          is_last_reply: false,
          reply_ancestor_ids: [],
          reply_connectors: [],
          reply_has_nested_children: false,
          reply_has_merged_children: false,
        })
      })
      const latestReplyIndexByName = new Map<string, number>()
      const replyIndexByNo = new Map<number, number>()

      function hasReplyAncestor(replyId: number, ancestorId: number) {
        let parentId = parentMap.get(replyId)

        while (parentId !== undefined) {
          if (parentId === ancestorId) return true
          parentId = parentMap.get(parentId)
        }

        return false
      }

      function replyMentionsUsername(reply: Reply, username: string) {
        return getReplyReferences(reply.content).some(
          reference => reference.username === username
        )
      }

      function branchMentionsUsername(
        replyId: number,
        ancestorId: number,
        username: string
      ) {
        let currentId: number | undefined = replyId

        while (currentId !== undefined && currentId !== ancestorId) {
          const currentReply = replyMap.get(currentId)
          if (!currentReply) return false

          if (
            currentReply.member.username === username ||
            replyMentionsUsername(currentReply, username)
          ) {
            return true
          }

          currentId = parentMap.get(currentId)
        }

        return false
      }

      function getFirstReferenceReplyInBranch(
        replyId: number,
        referenceUsername: string
      ) {
        let currentId: number | undefined = replyId
        let firstReferenceReply: Reply | undefined

        while (currentId !== undefined) {
          const currentReply = replyMap.get(currentId)
          if (!currentReply) return firstReferenceReply

          if (replyMentionsUsername(currentReply, referenceUsername)) {
            firstReferenceReply = currentReply
          }

          currentId = parentMap.get(currentId)
        }

        return firstReferenceReply
      }

      function getSameReferenceParent(
        reply: Reply,
        referenceUsername: string,
        candidate: { index: number; reply: Reply }
      ) {
        const referenceReply = getFirstReferenceReplyInBranch(
          candidate.reply.id,
          referenceUsername
        )
        if (!referenceReply) return candidate.reply

        if (referenceReply.member.username === reply.member.username) {
          return candidate.reply
        }

        const referenceParentId = parentMap.get(referenceReply.id)
        if (referenceParentId === undefined) return candidate.reply

        const referenceParent = replyMap.get(referenceParentId)
        if (
          !referenceParent ||
          referenceParent.member.username !== referenceUsername
        ) {
          return candidate.reply
        }

        if (
          candidate.reply.id !== referenceParent.id &&
          !hasReplyAncestor(candidate.reply.id, referenceParent.id)
        ) {
          return candidate.reply
        }

        if (
          branchMentionsUsername(
            candidate.reply.id,
            referenceParent.id,
            reply.member.username
          )
        ) {
          return candidate.reply
        }

        return referenceParent
      }

      function getParentReply(reply: Reply, replyIndex: number) {
        let latestExternalCandidate: { index: number; reply: Reply } | undefined
        let latestCandidate: { index: number; reply: Reply } | undefined

        for (const reference of getReplyReferences(reply.content)) {
          const parentIndex =
            reference.replyNo === undefined
              ? latestReplyIndexByName.get(reference.username)
              : replyIndexByNo.get(reference.replyNo)

          if (parentIndex === undefined || parentIndex >= replyIndex) {
            continue
          }

          const candidate = {
            index: parentIndex,
            reply: replyMap.get(ascList[parentIndex].id)!,
          }

          if (
            reference.replyNo !== undefined &&
            candidate.reply.member.username !== reference.username
          ) {
            continue
          }

          if (reference.replyNo !== undefined) {
            return { reply: candidate.reply, isExplicit: true }
          }

          candidate.reply = getSameReferenceParent(
            reply,
            reference.username,
            candidate
          )

          if (!latestCandidate || candidate.index > latestCandidate.index) {
            latestCandidate = candidate
          }

          if (
            candidate.reply.member.username !== reply.member.username &&
            (!latestExternalCandidate ||
              candidate.index > latestExternalCandidate.index)
          ) {
            latestExternalCandidate = candidate
          }
        }

        let parent = (latestExternalCandidate || latestCandidate)?.reply
        if (!parent) return

        while (parent.member.username === reply.member.username) {
          const parentId = parentMap.get(parent.id)
          if (parentId === undefined) return
          parent = replyMap.get(parentId)!
        }

        return parent.id === reply.id
          ? undefined
          : { reply: parent, isExplicit: false }
      }

      function getContinuationParent(
        reply: Reply,
        replyIndex: number,
        parent: Reply
      ) {
        if (replyIndex === 0) return parent

        for (let i = replyIndex - 1; i >= 0; i--) {
          const previousReply = replyMap.get(ascList[i].id)
          if (!previousReply) continue

          if (previousReply.member.username !== reply.member.username) {
            continue
          }

          if (hasReplyAncestor(previousReply.id, parent.id)) {
            return previousReply
          }
        }

        return parent
      }

      for (let i = 0; i < ascList.length; i++) {
        const reply = ascList[i]
        const child = replyMap.get(reply.id)!
        const parent = getParentReply(reply, i)
        const resolvedParent = parent
          ? parent.isExplicit
            ? parent.reply
            : getContinuationParent(reply, i, parent.reply)
          : undefined

        if (resolvedParent && !parentMap.has(child.id)) {
          child.reply_level = (resolvedParent.reply_level || 0) + 1
          child.is_first_reply = resolvedParent.children.length === 0
          resolvedParent.children.push(child)
          parentMap.set(child.id, resolvedParent.id)
        }
        latestReplyIndexByName.set(reply.member.username, i)
        replyIndexByNo.set(reply.no, i)
      }
      const result: Reply[] = []
      ascList.forEach(reply => {
        if (!parentMap.has(reply.id)) {
          result.push(replyMap.get(reply.id)!)
        }
      })
      function getTwoPersonParticipants(reply: Reply) {
        if (reply.children.length !== 1) return

        const child = reply.children[0]
        if (reply.member.username === child.member.username) return

        return new Set([reply.member.username, child.member.username])
      }

      function shouldMergeChild(
        parent: Reply,
        child: Reply,
        level: number,
        parentHasSiblings: boolean,
        sameLevelParticipants: Set<string> | undefined
      ) {
        if (
          parent.member.username === child.member.username &&
          hasExplicitReplyReference(
            child.content,
            parent.member.username,
            parent.no
          )
        ) {
          return false
        }

        if (parent.children.length !== 1) {
          return false
        }

        if (
          sameLevelParticipants &&
          level > 0 &&
          !parentHasSiblings &&
          sameLevelParticipants.has(child.member.username)
        ) {
          return true
        }

        if (parentHasSiblings && level > 0) {
          return false
        }

        if (level === 1) {
          return false
        }

        if (parent.member.username === child.member.username) {
          return true
        }

        if (level === 0) {
          return false
        }

        const usernames = new Set([parent.member.username])
        let current = parent
        let depth = 0

        while (current.children.length === 1 && depth < 2) {
          const next = current.children[0]
          usernames.add(next.member.username)
          if (usernames.size > 2) return false
          current = next
          depth++
        }

        return usernames.size === 2 && depth >= 1
      }

      function flattenReply(
        reply: Reply,
        level: number,
        connectorStack: boolean[],
        ancestorIds: number[],
        is_merged: boolean,
        hasNextSibling: boolean,
        hasSibling: boolean,
        sameLevelParticipants: Set<string> | undefined
      ): Reply[] {
        const nextSameLevelParticipants =
          sameLevelParticipants ||
          (level === 0 ? getTwoPersonParticipants(reply) : undefined)
        const childMergeStates = reply.children.map(child =>
          shouldMergeChild(
            reply,
            child,
            level,
            hasSibling,
            sameLevelParticipants
          )
        )
        const hasNestedChildren = childMergeStates.some(isMerged => !isMerged)
        const hasMergedChildren = childMergeStates.some(Boolean)
        const replyConnectors = connectorStack.slice(0, level)
        if (level > 0) {
          replyConnectors[level - 1] = !is_merged && hasNextSibling
        }

        const updatedReply = {
          ...reply,
          reply_level: level,
          reply_ancestor_ids: ancestorIds,
          is_merged,
          is_last_reply: !hasNextSibling,
          reply_connectors: replyConnectors,
          reply_has_nested_children: hasNestedChildren,
          reply_has_merged_children: hasMergedChildren,
        }

        const replies: Reply[] = [updatedReply]

        reply.children.forEach((child, childIndex) => {
          const childIsMerged = childMergeStates[childIndex]
          const childLevel = childIsMerged ? level : level + 1
          const childHasNextSibling = childIndex < reply.children.length - 1
          const childSameLevelParticipants = nextSameLevelParticipants?.has(
            child.member.username
          )
            ? nextSameLevelParticipants
            : undefined

          replies.push(
            ...flattenReply(
              child,
              childLevel,
              replyConnectors,
              [...ancestorIds, reply.id],
              childIsMerged,
              childHasNextSibling,
              reply.children.length > 1,
              childSameLevelParticipants
            )
          )
        })

        return replies
      }

      function hasLaterReplyAtSameLevel(replies: Reply[], index: number) {
        const reply = replies[index]
        const level = reply.reply_level || 0

        if (reply.is_merged) {
          for (let i = index + 1; i < replies.length; i++) {
            const nextReply = replies[i]
            if (!nextReply.is_merged) continue

            return last(nextReply.reply_ancestor_ids) === reply.id
          }

          return false
        }

        const ancestorId =
          level > 0 ? reply.reply_ancestor_ids?.[level - 1] : undefined

        for (let i = index + 1; i < replies.length; i++) {
          const nextReply = replies[i]
          if ((nextReply.reply_level || 0) !== level) continue

          if (level === 0) return true

          if (nextReply.reply_ancestor_ids?.[level - 1] === ancestorId) {
            return true
          }
        }

        return false
      }

      function normalizeFlattenedReplies(replies: Reply[]) {
        if (replies.length <= 2) return replies

        const sortedReplies = replies
        const replyIndexById = new Map(
          sortedReplies.map((reply, index) => [reply.id, index])
        )
        const parentConnectorRanges = sortedReplies.flatMap(
          (reply, childIndex) => {
            const parentId = last(reply.reply_ancestor_ids)
            if (parentId === undefined) return []

            const parentIndex = replyIndexById.get(parentId)
            if (parentIndex === undefined || parentIndex + 1 >= childIndex) {
              return []
            }

            for (let i = parentIndex + 1; i < childIndex; i++) {
              const previousReply = sortedReplies[i]
              if (
                last(previousReply.reply_ancestor_ids) === parentId &&
                previousReply.reply_level === reply.reply_level
              ) {
                return []
              }
            }

            const level = reply.reply_level || 0
            const connectorLevel = reply.is_merged ? level : level - 1
            if (connectorLevel < 0) return []

            return [
              {
                connectorLevel,
                startIndex: parentIndex + 1,
                endIndex: childIndex,
              },
            ]
          }
        )

        return sortedReplies.map((reply, index) => {
          const level = reply.reply_level || 0
          const activeConnectorLevels = new Set<number>()
          reply.reply_connectors?.forEach((isActive, connectorLevel) => {
            if (isActive) activeConnectorLevels.add(connectorLevel)
          })
          parentConnectorRanges
            .filter(
              range => range.startIndex <= index && index < range.endIndex
            )
            .forEach(range => {
              activeConnectorLevels.add(range.connectorLevel)
            })
          const connectorLength = Math.max(
            level,
            ...Array.from(
              activeConnectorLevels,
              connectorLevel => connectorLevel + 1
            )
          )
          const replyConnectors = Array.from(
            { length: connectorLength },
            (_, i) => activeConnectorLevels.has(i)
          )

          return {
            ...reply,
            is_last_reply: !hasLaterReplyAtSameLevel(sortedReplies, index),
            reply_connectors: replyConnectors,
          }
        })
      }

      function flattenReplies(replies: Reply[], level = 0): Reply[] {
        const flattenedReplies: Reply[] = []

        replies.forEach((reply, replyIndex) => {
          flattenedReplies.push(
            ...normalizeFlattenedReplies(
              flattenReply(
                reply,
                level,
                [],
                [],
                false,
                replyIndex < replies.length - 1,
                replies.length > 1,
                undefined
              )
            )
          )
        })

        return flattenedReplies
      }

      _flatedData = flattenReplies(result)
    } else if (orderBy === 'reverse') {
      _flatedData = rawList.slice().reverse()
    } else {
      _flatedData = rawList
    }

    if (_flatedData.length > 0 && orderBy !== 'smart') {
      const lastReplyIndex = _flatedData.length - 1
      const lastReply = _flatedData[lastReplyIndex]

      if (!lastReply.is_last_reply) {
        const nextFlatedData =
          _flatedData === rawList ? _flatedData.slice() : _flatedData

        nextFlatedData[lastReplyIndex] = {
          ...lastReply,
          is_last_reply: true,
        }

        return nextFlatedData
      }
    }
    return _flatedData
  }, [rawReplies, orderBy])
  const [collapsedReplyIds, setCollapsedReplyIds] = useState<Set<number>>(
    () => new Set()
  )
  const replyListEntryCacheRef = useRef(new Map<number, ReplyListEntry>())
  const replyListData = useMemo<ReplyListEntry[]>(() => {
    const cache = replyListEntryCacheRef.current
    const visibleReplyIds = new Set<number>()
    const visibleReplies =
      orderBy === 'smart' && collapsedReplyIds.size > 0
        ? flatedData.filter(reply => {
            return !reply.reply_ancestor_ids?.some(id =>
              collapsedReplyIds.has(id)
            )
          })
        : flatedData

    const entries = visibleReplies.map(reply => {
      const collapsed = orderBy === 'smart' && collapsedReplyIds.has(reply.id)
      const cachedEntry = cache.get(reply.id)

      visibleReplyIds.add(reply.id)

      if (
        cachedEntry &&
        cachedEntry.reply === reply &&
        cachedEntry.collapsed === collapsed
      ) {
        return cachedEntry
      }

      const entry = {
        reply,
        collapsed,
      }

      cache.set(reply.id, entry)
      return entry
    })

    cache.forEach((_, replyId) => {
      if (!visibleReplyIds.has(replyId)) {
        cache.delete(replyId)
      }
    })

    return entries
  }, [collapsedReplyIds, flatedData, orderBy])
  const [replyInfo, setReplyInfo] = useState<ReplyInfo | null>(null)
  const toggleReplyCollapse = useCallback((replyId: number) => {
    startTransition(() => {
      setCollapsedReplyIds(prev => {
        const next = new Set(prev)
        if (next.has(replyId)) {
          next.delete(replyId)
        } else {
          next.add(replyId)
        }
        return next
      })
    })
  }, [])
  const handleReply = useCallback(
    (username: string, replyNo?: number) =>
      setReplyInfo({ topicId: topic.id, username, replyNo }),
    [topic.id]
  )
  const [isFetchingAllPage, setIsFetchingAllPage] = useState(false)
  const handleAppend = useCallback(() => {
    setReplyInfo({ topicId: topic.id, isAppend: true })
  }, [topic.id])
  const handleOrderByChange = useCallback(
    async (v: RepliesMode | 'reverse') => {
      if (v === 'reverse' && isFetching) {
        Toast.show({
          type: 'error',
          text1: '请等待当前请求完成后再切换',
        })
        return
      }

      if (v === 'reverse' && hasNextPage && topic.last_page - topic.page > 9) {
        Toast.show({
          type: 'error',
          text1: '该帖子页数过多无法启用最新模式',
        })
        return
      }

      if (v !== 'reverse') {
        setRepliesMode(v)
      }

      startTransition(() => {
        if (v !== 'smart') {
          setCollapsedReplyIds(prev => (prev.size === 0 ? prev : new Set()))
        }
        setOrderBy(v)
      })

      if (v === 'reverse' && hasNextPage) {
        // using fetchNextPage if the topic has only a next page
        if (topic.last_page - topic.page === 1) {
          fetchNextPage()
          return
        }

        // fetch all page
        if (!isFetchingAllPage) {
          setIsFetchingAllPage(true)
          try {
            const pageToData = Object.fromEntries(
              data!.pageParams.map((page, i) => [page, data!.pages[i]])
            )
            const allPageNo = Array.from({
              length: topic.last_page,
            }).map((_, i) => i + 1)
            const pageDatas = await Promise.all(
              allPageNo.map(page => {
                if (!pageToData[page] || page === topic.last_page) {
                  return k.topic.detail.fetcher(
                    {
                      id: params.id,
                    },
                    {
                      pageParam: page,
                    }
                  )
                }
                return pageToData[page]
              })
            )

            queryClient.setQueryData(
              k.topic.detail.getKey({ id: params.id }),
              allPageNo.reduce(
                (acc, p, i) => {
                  acc.pageParams[i] = p
                  acc.pages[i] = pageDatas[i]
                  return acc
                },
                {
                  pages: [],
                  pageParams: [],
                } as typeof data
              )
            )
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: error instanceof BizError ? error.message : '请求失败',
            })
          } finally {
            setIsFetchingAllPage(false)
          }
        }
      }
    },
    [
      data,
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingAllPage,
      params.id,
      setRepliesMode,
      topic.last_page,
      topic.page,
    ]
  )
  const renderItem: ListRenderItem<ReplyListEntry> = useCallback(
    ({ item }) => (
      <TopicReplyListItem
        item={item}
        topicId={topic.id}
        once={topic.once}
        hightlight={
          params.hightlightReplyNo
            ? params.hightlightReplyNo === item.reply.no
            : undefined
        }
        showNestedReply={orderBy === 'smart'}
        showLegacyUi={orderBy !== 'smart'}
        onToggleCollapse={toggleReplyCollapse}
        onReply={handleReply}
      />
    ),
    [
      topic.id,
      topic.once,
      params.hightlightReplyNo,
      orderBy,
      toggleReplyCollapse,
      handleReply,
    ]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const safeAreaInsets = useSafeAreaInsets()

  const flatListRef = useRef<FlatList<ReplyListEntry>>(null)

  const scrollY = useRef(new Animated.Value(0)).current

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <Animated.FlatList
        ref={flatListRef}
        key={colorScheme}
        data={replyListData}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={orderBy !== 'smart' ? LineSeparator : null}
        {...REPLY_LIST_PERFORMANCE_PROPS}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            progressViewOffset={navbarHeight}
          />
        }
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          }
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <TopicDetailHeader
            topic={topic}
            orderBy={orderBy}
            showLoading={
              (isFetching || isFetchingAllPage) && !isRefetchingByUser
            }
            onAppend={handleAppend}
            onOrderByChange={handleOrderByChange}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null
        }
        ListEmptyComponent={<Empty description="目前还没有回复" />}
      />

      {replyInfo ? (
        <ReplyBox
          replyInfo={replyInfo}
          onCancel={() => {
            setReplyInfo(null)
          }}
          onSuccess={() => {
            refetch()
            setReplyInfo(null)
          }}
          once={topic.once}
        />
      ) : (
        <View
          style={tw.style(
            `flex-row items-center justify-between pt-4 pb-[${Math.max(
              safeAreaInsets.bottom,
              16
            )}px] px-4 border-t border-solid border-[${colors.divider}]`
          )}
        >
          <VoteButton topic={topic} />

          <View style={tw`flex flex-row flex-shrink-0 ml-auto gap-4`}>
            <IconButton
              color={colors.default}
              activeColor={colors.foreground}
              size={24}
              name="arrow-collapse-up"
              onPress={() => {
                flatListRef.current?.scrollToOffset({ offset: 0 })
              }}
            />

            {!isSelf(topic.member?.username) && <ThankTopic topic={topic} />}

            <LikeTopic topic={topic} />

            <Pressable
              style={tw.style(`flex-row items-center relative`)}
              onPress={() => {
                setReplyInfo({ topicId: topic.id })
              }}
            >
              {({ pressed }) => (
                <Fragment>
                  <IconButton
                    color={colors.default}
                    activeColor={colors.primary}
                    icon={<Feather name="message-circle" />}
                    pressed={pressed}
                    size={24}
                  />

                  {!!topic.reply_count && (
                    <Text
                      style={tw.style(
                        `text-[10px] absolute -top-1 left-4 px-0.5  bg-[${colors.base100}] text-[${colors.default}] rounded-sm overflow-hidden`
                      )}
                    >
                      {topic.reply_count}
                    </Text>
                  )}
                </Fragment>
              )}
            </Pressable>

            <TouchableOpacity
              style={tw`relative`}
              onPress={() => {
                navigation.push('MemberDetail', {
                  username: topic.member?.username!,
                })
              }}
            >
              <StyledImage
                style={tw`rounded-full w-7 h-7`}
                source={topic.member?.avatar}
              />

              <View
                style={tw.style(
                  `w-full absolute -bottom-1 flex-row items-center justify-center`
                )}
              >
                <View
                  style={tw`border border-[${colors.divider}] border-solid px-1 bg-[${colors.base100}] rounded-full`}
                >
                  <Entypo name="link" size={10} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />

        <NavBar>
          <Animated.Text
            numberOfLines={1}
            style={tw.style(
              `text-[${colors.foreground}] ${fontSize.large} font-semibold absolute inset-x-0`,
              {
                opacity: scrollY.interpolate({
                  inputRange: [0, 96],
                  outputRange: [1, 0],
                }),
              }
            )}
          >
            帖子
          </Animated.Text>
          <Animated.Text
            numberOfLines={1}
            style={tw.style(
              `text-[${colors.foreground}] ${fontSize.large} font-semibold absolute w-full inset-x-0`,
              {
                opacity: scrollY.interpolate({
                  inputRange: [70, 96],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    translateY: scrollY.interpolate({
                      inputRange: [70, 106],
                      outputRange: [36, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              }
            )}
          >
            {topic.title}
          </Animated.Text>
        </NavBar>
      </View>
    </View>
  )
}
