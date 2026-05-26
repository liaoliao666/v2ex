import { Entypo, Feather } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtom, useAtomValue } from 'jotai'
import { cloneDeep, last, uniqBy } from 'lodash-es'
import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  ListRenderItem,
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
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Reply, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import { isSelf } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import tw from '@/utils/tw'
import useMount from '@/utils/useMount'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

import { getAtNameList } from './RelatedRepliesScreen'

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
  const [repliesMode, setRepliesMode] = useAtom(repliesModeAtom)
  const [orderBy, setOrderBy] = useState<RepliesMode | 'reverse'>(repliesMode)
  const flatedData = useMemo(() => {
    const rawList = cloneDeep(
      uniqBy(data?.pages.map(page => page.replies).flat() || [], 'id')
    )
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
          reply_connectors: [],
          reply_has_nested_children: false,
        })
      })
      const latestReplyIndexByName = new Map<string, number>()

      function getParentReply(reply: Reply, replyIndex: number) {
        const candidates = Array.from(getAtNameList(reply.content))
          .map(name => {
            const parentIndex = latestReplyIndexByName.get(name)
            if (parentIndex === undefined || parentIndex >= replyIndex) {
              return null
            }

            return {
              index: parentIndex,
              reply: replyMap.get(ascList[parentIndex].id)!,
            }
          })
          .filter(Boolean) as { index: number; reply: Reply }[]

        if (!candidates.length) return

        const externalCandidates = candidates.filter(
          candidate => candidate.reply.member.username !== reply.member.username
        )
        const parentCandidate = (
          externalCandidates.length ? externalCandidates : candidates
        ).sort((a, b) => b.index - a.index)[0]
        let parent = parentCandidate.reply

        while (parent.member.username === reply.member.username) {
          const parentId = parentMap.get(parent.id)
          if (parentId === undefined) return
          parent = replyMap.get(parentId)!
        }

        return parent.id === reply.id ? undefined : parent
      }

      for (let i = 0; i < ascList.length; i++) {
        const reply = ascList[i]
        const child = replyMap.get(reply.id)!
        const parent = getParentReply(reply, i)

        if (parent && !parentMap.has(child.id)) {
          child.reply_level = (parent.reply_level || 0) + 1
          child.is_first_reply = parent.children.length === 0
          parent.children.push(child)
          parentMap.set(child.id, parent.id)
        }
        latestReplyIndexByName.set(reply.member.username, i)
      }
      const result: Reply[] = []
      ascList.forEach(reply => {
        if (!parentMap.has(reply.id)) {
          result.push(replyMap.get(reply.id)!)
        }
      })

      function shouldMergeChild(
        parent: Reply,
        child: Reply,
        level: number,
        parentHasSiblings: boolean
      ) {
        if (parent.children.length !== 1) {
          return false
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
        is_merged: boolean,
        hasNextSibling: boolean,
        hasSibling: boolean
      ): Reply[] {
        const childMergeStates = reply.children.map(child =>
          shouldMergeChild(reply, child, level, hasSibling)
        )
        const hasNestedChildren = childMergeStates.some(isMerged => !isMerged)
        const hasMergedChildren = childMergeStates.some(Boolean)
        const replyConnectors = connectorStack.slice(0, level)
        if (level > 0) {
          const shouldContinueConnector = hasNextSibling || hasMergedChildren

          replyConnectors[0] = true
          replyConnectors[level - 1] = shouldContinueConnector
        }

        const updatedReply = {
          ...reply,
          reply_level: level,
          is_merged,
          is_last_reply: !hasNextSibling,
          reply_connectors: replyConnectors,
          reply_has_nested_children: hasNestedChildren,
        }

        return [
          updatedReply,
          ...reply.children.flatMap((child, childIndex) => {
            const childIsMerged = childMergeStates[childIndex]
            const childLevel = childIsMerged ? level : level + 1
            const hasNextNestedSibling =
              !childIsMerged &&
              childMergeStates.slice(childIndex + 1).some(isMerged => !isMerged)

            return flattenReply(
              child,
              childLevel,
              replyConnectors,
              childIsMerged,
              hasNextNestedSibling,
              reply.children.length > 1
            )
          }),
        ]
      }

      function flattenReplies(replies: Reply[], level = 0): Reply[] {
        return replies.flatMap((reply, replyIndex) => {
          return flattenReply(
            reply,
            level,
            [],
            false,
            replyIndex < replies.length - 1,
            replies.length > 1
          )
        })
      }

      _flatedData = flattenReplies(result)
    } else if (orderBy === 'reverse') {
      _flatedData = [...rawList].reverse()
    } else {
      _flatedData = rawList
    }

    if (last(_flatedData) && orderBy !== 'smart') {
      last(_flatedData)!.is_last_reply = true
    }
    return _flatedData
  }, [data?.pages, orderBy])
  const [replyInfo, setReplyInfo] = useState<ReplyInfo | null>(null)
  const renderItem: ListRenderItem<Reply> = useCallback(
    ({ item }) => (
      <View>
        <ReplyItem
          reply={item as Reply}
          key={`${item.id}_${item.reply_level}`}
          topicId={topic.id}
          once={topic.once}
          hightlight={
            params.hightlightReplyNo
              ? params.hightlightReplyNo === item.no
              : undefined
          }
          showNestedReply={orderBy === 'smart'}
          showLegacyUi={orderBy !== 'smart'}
          onReply={username => setReplyInfo({ topicId: topic.id, username })}
        />
      </View>
    ),
    [topic.id, topic.once, params.hightlightReplyNo, orderBy]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const [isFetchingAllPage, setIsFetchingAllPage] = useState(false)

  const safeAreaInsets = useSafeAreaInsets()

  const flatListRef = useRef<FlatList<Reply>>(null)

  const scrollY = useRef(new Animated.Value(0)).current

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <Animated.FlatList
        ref={flatListRef}
        key={colorScheme}
        data={flatedData}
        ItemSeparatorComponent={orderBy !== 'smart' ? LineSeparator : null}
        removeClippedSubviews={false}
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
        // ItemSeparatorComponent={LineSeparator}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          }
        )}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <TopicInfo
            topic={topic}
            onAppend={() => {
              setReplyInfo({ topicId: topic.id, isAppend: true })
            }}
          >
            <View
              style={tw.style(
                `flex-row items-center pt-3 mt-2 border-t border-solid border-[${colors.divider}]`
              )}
            >
              <Text style={tw`text-[${colors.foreground}] ${fontSize.medium}`}>
                全部回复
              </Text>
              {(isFetching || isFetchingAllPage) && !isRefetchingByUser && (
                <StyledActivityIndicator size="small" style={tw`ml-2`} />
              )}

              <RadioButtonGroup
                style={tw`ml-auto`}
                options={
                  [
                    { label: '默认', value: 'default' },
                    { label: '智能', value: 'smart' },
                    { label: '最新', value: 'reverse' },
                  ] as {
                    label: string
                    value: typeof orderBy
                  }[]
                }
                value={orderBy}
                onChange={async v => {
                  if (v === 'reverse' && isFetching) {
                    Toast.show({
                      type: 'error',
                      text1: '请等待当前请求完成后再切换',
                    })
                    return
                  }

                  if (v !== 'reverse') {
                    setRepliesMode(v)
                  }

                  setOrderBy(v)

                  if (v === 'reverse' && hasNextPage) {
                    if (topic.last_page - topic.page > 9) {
                      Toast.show({
                        type: 'error',
                        text1: '该帖子页数过多无法启用最新模式',
                      })
                      return
                    }

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
                          data!.pageParams.map((page, i) => [
                            page,
                            data!.pages[i],
                          ])
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
                          text1:
                            error instanceof BizError
                              ? error.message
                              : '请求失败',
                        })
                      } finally {
                        setIsFetchingAllPage(false)
                      }
                    }
                  }
                }}
              />
            </View>
          </TopicInfo>
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
