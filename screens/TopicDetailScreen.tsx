import { Entypo, Feather } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { last, uniqBy } from 'lodash-es'
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
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { topicService } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSelf } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
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

  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = topicService.detail.useSuspenseInfiniteQuery({
    variables: { id: params.id },
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const topic = last(data?.pages)!

  const [orderBy, setOrderBy] = useState<OrderBy>('asc')

  const flatedData = useMemo(() => {
    const result = uniqBy(
      data?.pages.map(page => page.replies).flat() || [],
      'id'
    )
    if (orderBy === 'desc') result.reverse()
    return result
  }, [data?.pages, orderBy])

  const [replyInfo, setReplyInfo] = useState<ReplyInfo | null>(null)

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
        onReply={username => setReplyInfo({ topicId: topic.id, username })}
      />
    ),
    [topic.id, topic.once, params.hightlightReplyNo]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const [isFetchingAllPage, setIsFetchingAllPage] = useState(false)

  const safeAreaInsets = useSafeAreaInsets()

  const flatListRef = useRef<FlatList<Reply>>(null)

  const scrollY = useRef(new Animated.Value(0)).current

  return (
    <View style={tw`flex-1 bg-background`}>
      <Animated.FlatList
        ref={flatListRef}
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
                `flex-row items-center pt-3 mt-2 border-t border-solid border-divider`
              )}
            >
              <Text style={tw`text-foreground ${getFontSize(5)}`}>
                全部回复
              </Text>
              {(isFetching || isFetchingAllPage) && !isRefetchingByUser && (
                <StyledActivityIndicator size="small" style={tw`ml-2`} />
              )}

              <RadioButtonGroup
                style={tw`ml-auto`}
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
                  if (v === 'desc' && isFetching) {
                    Toast.show({
                      type: 'error',
                      text1: '请等待当前请求完成后再切换',
                    })
                    return
                  }

                  setOrderBy(v)

                  if (v === 'desc' && hasNextPage) {
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
                            if (pageToData[page]) return pageToData[page]
                            return topicService.detail.fetcher(
                              {
                                id: params.id,
                              },
                              {
                                pageParam: page,
                              }
                            )
                          })
                        )

                        queryClient.setQueryData(
                          topicService.detail.getKey({ id: params.id }),
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
        ListEmptyComponent={
          <View style={tw.style(`items-center py-32`)}>
            <Text style={tw`text-default ${getFontSize(6)}`}>
              目前还没有回复
            </Text>
          </View>
        }
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
            )}px] px-4 border-t border-solid border-divider`
          )}
        >
          <VoteButton topic={topic} />

          <View style={tw`flex flex-row flex-shrink-0 ml-auto gap-4`}>
            <IconButton
              color={tw.color(`text-default`)}
              activeColor={tw.color(`text-default`)}
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
                    color={tw.color(`text-default`)}
                    activeColor={tw.color(`text-primary`)}
                    icon={<Feather name="message-circle" />}
                    pressed={pressed}
                    size={24}
                  />

                  {!!topic.reply_count && (
                    <Text
                      style={tw.style(
                        `text-[10px] absolute -top-1 left-4 px-0.5  bg-background text-default rounded-sm overflow-hidden`
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
                source={{
                  uri: topic.member?.avatar,
                }}
              />

              <View
                style={tw.style(
                  `w-full absolute -bottom-1 flex-row items-center justify-center`
                )}
              >
                <View
                  style={tw`border border-divider border-solid px-1 bg-background rounded-full`}
                >
                  <Entypo
                    name="link"
                    size={10}
                    color={tw.color(`text-primary`)}
                  />
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
            style={tw.style(`text-foreground ${getFontSize(4)} font-semibold`, {
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
            })}
          >
            {topic.title}
          </Animated.Text>
        </NavBar>
      </View>
    </View>
  )
}
