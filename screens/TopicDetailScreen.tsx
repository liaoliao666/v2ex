import { Octicons } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { last, uniqBy } from 'lodash-es'
import { Fragment, useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { inferData } from 'react-query-kit'

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
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicDetailPlaceholder from '@/components/placeholder/TopicDetailPlaceholder'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import ReplyBox, { ReplyBoxRef } from '@/components/topic/ReplyBox'
import ReplyItem from '@/components/topic/ReplyItem'
import TopicInfo, {
  LikeTopic,
  ThankTopic,
  VoteButton,
} from '@/components/topic/TopicInfo'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isMe } from '@/utils/authentication'
import { removeUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(TopicDetailScreen, {
  LoadingComponent: () => {
    const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()
    return (
      <TopicDetailPlaceholder topic={params}>
        <TopicPlaceholder hideAnimation />
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

type OrderBy = 'asc' | 'desc'

function TopicDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()

  useMemo(() => {
    removeUnnecessaryPages(useTopicDetail.getKey({ id: params.id }))
  }, [params.id])

  const {
    data,
    setData,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTopicDetail({
    variables: { id: params.id },
    enabled: !!params.id,
    suspense: true,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const topic = last(data?.pages)!

  const replyBoxRef = useRef<ReplyBoxRef>(null)

  const [orderBy, setOrderBy] = useState<OrderBy>('asc')

  const flatedData = useMemo(() => {
    const result = uniqBy(
      data?.pages.map(page => page.replies).flat() || [],
      'id'
    )
    if (orderBy === 'desc') result.reverse()
    return result
  }, [data?.pages, orderBy])

  const renderItem: ListRenderItem<Reply> = useCallback(
    ({ item }) => (
      <ReplyItem
        key={item.id}
        reply={item as Reply}
        topicId={topic.id}
        once={topic.once}
        hightlight={
          params.hightlightReplyNo
            ? params.hightlightReplyNo === item.no
            : undefined
        }
        onReply={username => replyBoxRef.current?.replyFor({ username })}
      />
    ),
    [topic.id, topic.once, params.hightlightReplyNo]
  )

  const [avatarVisible, setAvatarVisible] = useState(true)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const isFetchingAllPageRef = useRef(false)

  return (
    <View style={tw`flex-1 bg-body-1`}>
      <FlatList
        key={colorScheme}
        data={flatedData}
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
        ItemSeparatorComponent={LineSeparator}
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
              replyBoxRef.current?.replyFor({ isAppend: true })
            }}
          >
            <View
              style={tw.style(
                `flex-row items-center justify-between pt-3 mt-2 border-t border-solid border-tint-border`
              )}
            >
              <VoteButton topic={topic} />

              <Pressable
                style={tw.style(`flex-row items-center`)}
                onPress={() => {
                  replyBoxRef.current?.replyFor()
                }}
              >
                {({ pressed }) => (
                  <Fragment>
                    <IconButton
                      color={tw.color(`text-tint-secondary`)}
                      activeColor="rgb(29,155,240)"
                      size={21}
                      icon={<Octicons name="comment" />}
                      pressed={pressed}
                    />

                    {!!topic.reply_count && (
                      <Text
                        style={tw.style(
                          `${getFontSize(6)} pl-1 text-tint-secondary`
                        )}
                      >
                        {topic.reply_count}
                      </Text>
                    )}
                  </Fragment>
                )}
              </Pressable>

              {!isMe(topic.member?.username) && <ThankTopic topic={topic} />}

              <LikeTopic topic={topic} />

              <RadioButtonGroup
                options={
                  [
                    { label: '默认', value: 'asc' },
                    { label: '最新', value: 'desc' },
                  ] as {
                    label: string
                    value: OrderBy
                  }[]
                }
                value={orderBy}
                onChange={async v => {
                  setOrderBy(v)

                  if (v === 'desc' && hasNextPage) {
                    // using fetchNextPage if the topic has only a next page
                    if (topic.last_page - topic.page === 1) {
                      fetchNextPage()
                      return
                    }

                    // fetch all page
                    if (!isFetchingAllPageRef.current) {
                      isFetchingAllPageRef.current = true
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
                            if (pageToData[page]) return pageToData[page]
                            // @ts-ignore
                            return useTopicDetail.queryFn({
                              queryKey: useTopicDetail.getKey({
                                id: params.id,
                              }),
                              pageParam: page,
                            })
                          })
                        )

                        setData(
                          allPageNo.reduce(
                            (acc, p, i) => {
                              acc.pageParams[i] = p
                              acc.pages[i] = pageDatas[i]
                              return acc
                            },
                            {
                              pages: [],
                              pageParams: [],
                            } as inferData<typeof useTopicDetail>
                          )
                        )
                      } catch (error) {
                        // empty
                      } finally {
                        isFetchingAllPageRef.current = false
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
        ListEmptyComponent={
          <View style={tw.style(`items-center py-16`)}>
            <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
              目前还没有回复
            </Text>
          </View>
        }
        onScroll={ev => {
          setAvatarVisible(ev.nativeEvent.contentOffset.y <= 64)
        }}
      />

      <ReplyBox
        onSuccess={refetch}
        once={topic.once}
        topicId={params.id}
        ref={replyBoxRef}
      />

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />

        <NavBar title="帖子">
          {!avatarVisible && (
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text
                  style={tw`text-tint-primary ${getFontSize(
                    4
                  )} font-medium w-4/5`}
                  numberOfLines={1}
                >
                  {topic.title}
                </Text>
              </View>

              <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
                {topic.reply_count} 条回复
              </Text>
            </View>
          )}
        </NavBar>
      </View>
    </View>
  )
}
