import { RouteProp, useRoute } from '@react-navigation/native'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { every, findIndex, last, pick, some, uniqBy } from 'lodash-es'
import { useMutation, useSuspenseQuery } from 'quaere'
import {
  Fragment,
  ReactNode,
  createRef,
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  Platform,
  ScrollViewProps,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { TabBar, TabView } from 'react-native-tab-view'
import Toast from 'react-native-toast-message'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import Html from '@/components/Html'
import LoadingIndicator from '@/components/LoadingIndicator'
import Money from '@/components/Money'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import Separator, { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicItem from '@/components/topic/TopicItem'
import { blackListAtom } from '@/jotai/blackListAtom'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import {
  blockMemberMutation,
  followMemberMutation,
  memberQuery,
  memberRepliesQuery,
  memberTopicsQuery,
} from '@/servicies/member'
import { Member, Reply, Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSelf, isSignined } from '@/utils/authentication'
import { queryClient, useRemoveUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 53
const TOP_BAR_BG_CLS = `bg-[rgb(51,51,68)]`
const TAB_VIEW_MARGIN_TOP = -2

export default withQuerySuspense(MemberDetailScreen, {
  LoadingComponent: () => (
    <MemberDetailSkeleton>
      <LoadingIndicator />
    </MemberDetailSkeleton>
  ),
  FallbackComponent: props => (
    <MemberDetailSkeleton>
      <FallbackComponent {...props} />
    </MemberDetailSkeleton>
  ),
})

function MemberDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

  useMemo(() => {
    queryClient.ensureQueryData({
      query: memberTopicsQuery,
      variables: { username: params.username },
      pages: 1,
    })

    queryClient.ensureQueryData({
      query: memberRepliesQuery,
      variables: { username: params.username },
      pages: 1,
    })
  }, [params.username])

  const { data: member } = useSuspenseQuery({
    query: memberQuery,
    variables: { username: params.username },
  })

  const layout = useWindowDimensions()

  const [routes] = useState(() => [
    {
      title: '主题',
      key: 'MemberTopics',
      scrollY: 0,
      ref: createRef<FlatList>(),
    },
    {
      title: '回复',
      key: 'MemberReplies',
      scrollY: 0,
      ref: createRef<FlatList>(),
    },
  ])

  const [index, setIndex] = useState(0)

  const [headerHeight, setHeaderHeight] = useState(0)

  const scrollY = useRef(new Animated.Value(0)).current

  const colorScheme = useAtomValue(colorSchemeAtom)

  const contentContainerStyle = {
    minHeight:
      layout.height -
      useNavBarHeight() +
      headerHeight +
      (Platform.OS === 'android' ? TAB_BAR_HEIGHT : 0) -
      TAB_VIEW_MARGIN_TOP,
    paddingTop: headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0,
  }

  return (
    <View style={tw`flex-1 bg-background`}>
      <NavBar
        style={tw.style(TOP_BAR_BG_CLS)}
        tintColor="#fff"
        statusBarStyle="light"
      >
        <Animated.View
          style={tw.style(`flex-row items-center flex-1`, {
            opacity: scrollY.interpolate({
              inputRange: [90, 120],
              outputRange: [0, 1],
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [90, 130],
                  outputRange: [30, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          })}
        >
          <StyledImage
            style={tw`w-5 h-5 rounded-full mr-2`}
            source={{ uri: member.avatar }}
          />

          <Text
            style={tw`text-white ${getFontSize(4)} font-semibold flex-1 mr-2`}
            numberOfLines={1}
          >
            {member.username}
          </Text>

          {!isSelf(params.username) && <FollowMember {...member} />}
        </Animated.View>
      </NavBar>

      <TabView
        style={{ marginTop: TAB_VIEW_MARGIN_TOP }}
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          const currentRoute = routes[index]

          const senceProps = {
            ref: route.ref,
            contentContainerStyle,
            onScroll: Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              {
                useNativeDriver: true,
                listener(ev) {
                  route.scrollY = (
                    ev.nativeEvent as NativeScrollEvent
                  ).contentOffset.y
                },
              }
            ),
            onScrollEnd: () => {
              routes.forEach(routeItem => {
                if (routeItem === currentRoute) return
                if (
                  currentRoute.scrollY >= headerHeight &&
                  routeItem.scrollY < headerHeight
                ) {
                  routeItem.ref.current?.scrollToOffset({
                    animated: false,
                    offset: headerHeight,
                  })
                } else if (
                  currentRoute.scrollY < headerHeight &&
                  currentRoute.scrollY !== routeItem.scrollY
                ) {
                  routeItem.ref.current?.scrollToOffset({
                    animated: false,
                    offset: currentRoute.scrollY,
                  })
                }
              })
            },
          }

          return route.key === 'MemberTopics' ? (
            <MemberTopics {...senceProps} />
          ) : (
            <MemberReplies {...senceProps} />
          )
        }}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => {
          return (
            <Animated.View
              pointerEvents="box-none"
              style={
                !!headerHeight && [
                  tw`absolute inset-x-0 top-0 z-10`,
                  {
                    height: headerHeight,
                    transform: [
                      {
                        translateY: scrollY.interpolate({
                          inputRange: [0, headerHeight],
                          outputRange: [0, -headerHeight],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]
              }
            >
              <View
                onLayout={ev => setHeaderHeight(ev.nativeEvent.layout.height)}
                pointerEvents="box-none"
                style={tw`bg-background`}
              >
                <MemberHeader />
              </View>

              <TabBar
                {...props}
                scrollEnabled
                style={tw`bg-background flex-row shadow-none border-b border-divider border-solid`}
                tabStyle={tw`w-[80px] h-[${TAB_BAR_HEIGHT}px]`}
                indicatorStyle={tw`w-[30px] ml-[25px] bg-foreground h-[3px] rounded-full`}
                renderTabBarItem={({ route }) => {
                  const active = routes[index].key === route.key

                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={tw`w-[80px] items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        setIndex(findIndex(routes, { key: route.key }))
                      }}
                    >
                      <Text
                        style={tw.style(
                          getFontSize(5),
                          active
                            ? tw`text-foreground font-medium`
                            : tw`text-default`
                        )}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </Animated.View>
          )
        }}
      />
    </View>
  )
}

const MemberHeader = memo(() => {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

  const { data: member } = useSuspenseQuery({
    query: memberQuery,
    variables: { username: params.username },
  })

  return (
    <Fragment>
      <View
        pointerEvents="none"
        style={tw.style(TOP_BAR_BG_CLS, `pt-10 px-4`)}
      />

      <View style={tw`-mt-8 px-4 flex-row`}>
        <View pointerEvents="none" style={tw`p-0.5 bg-background rounded-full`}>
          <StyledImage
            style={tw`w-[81.25px] h-[81.25px] rounded-full`}
            source={{
              uri: member.avatar,
            }}
          />
        </View>

        {!isSelf(params.username) && (
          <View style={tw`mt-10 ml-auto flex-row gap-2`}>
            <BlockMember {...member} />

            <FollowMember {...member} />
          </View>
        )}
      </View>

      <View pointerEvents="none" style={tw`mt-3 px-4 gap-1`}>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-foreground ${getFontSize(2)} font-extrabold`}
            selectable
          >
            {member.username}
          </Text>

          <View style={tw`flex-row gap-2`} pointerEvents="none">
            <View
              style={tw`rounded-full overflow-hidden justify-center items-center`}
            >
              <Svg height="100%" width="100%" style={tw`absolute inset-0`}>
                <Defs>
                  <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0" stopColor={'#52bf1c'} />
                    <Stop offset="1" stopColor={'#438906'} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grad)" />
              </Svg>

              <Text
                style={tw`px-1 text-white ${getFontSize(
                  6
                )} font-medium text-center`}
              >
                ONLINE
              </Text>
            </View>

            <Money {...pick(member, ['gold', 'silver', 'bronze'])} />
          </View>
        </View>

        {!!member.motto && (
          <View pointerEvents="none">
            <Text style={tw`text-default ${getFontSize(5)}`}>
              {member.motto}
            </Text>
          </View>
        )}

        {some([member.company, member.title]) && (
          <View style={tw`flex-row flex-wrap`}>
            {member.company && (
              <Text style={tw`font-medium text-foreground ${getFontSize(5)}`}>
                🏢 {member.company}
              </Text>
            )}
            {every([member.company, member.title]) && (
              <Text style={tw`text-default ${getFontSize(5)} px-1`}>/</Text>
            )}
            {member.title && (
              <Text style={tw`text-default ${getFontSize(5)} flex-1`}>
                {member.title}
              </Text>
            )}
          </View>
        )}

        <Text style={tw`text-default ${getFontSize(5)}`}>
          {`V2EX 第 ${member.id} 号会员，加入于 ${member.created}`}
        </Text>

        <Text style={tw`text-default ${getFontSize(5)}`}>
          {`今日活跃度排名 ${member.activity}`}
        </Text>

        {!!member.overview && (
          <View style={tw`border-t border-solid border-divider pt-2`}>
            <Html source={{ html: member.overview }} />
          </View>
        )}
      </View>

      {!!member.widgets?.length && (
        <View
          style={tw`mt-2 px-4 flex-row flex-wrap gap-2`}
          pointerEvents="box-none"
        >
          {member.widgets.map(widget => (
            <TouchableOpacity
              key={widget.link}
              style={tw`bg-content rounded-full py-1.5 pl-2 pr-2.5 flex-row items-center`}
              onPress={() => {
                navigation.navigate('Webview', { url: widget.link })
              }}
            >
              <StyledImage
                style={tw`w-5 h-5 mr-1`}
                source={{
                  uri: widget.uri,
                }}
              />
              <Text
                style={tw`${getFontSize(5)} text-default flex-shrink`}
                numberOfLines={1}
              >
                {widget.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Fragment>
  )
})

const MemberTopics = forwardRef<
  FlatList,
  {
    contentContainerStyle: ViewStyle
    onScrollEnd: () => void
    onScroll: ScrollViewProps['onScroll']
  }
>(({ contentContainerStyle, onScroll, onScrollEnd }, ref) => {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

  useRemoveUnnecessaryPages({
    query: memberTopicsQuery,
    variables: { username: params.username },
  })

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseQuery({
      query: memberTopicsQuery,
      variables: { username: params.username },
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} hideAvatar />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  return (
    <Animated.FlatList
      ref={ref}
      data={flatedData}
      onScroll={onScroll}
      onMomentumScrollEnd={onScrollEnd}
      onScrollEndDrag={onScrollEnd}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <StyledRefreshControl
          refreshing={isRefetchingByUser}
          onRefresh={refetchByUser}
          progressViewOffset={contentContainerStyle.paddingTop as number}
        />
      }
      ItemSeparatorComponent={LineSeparator}
      renderItem={renderItem}
      onEndReached={() => {
        if (hasNextPage) {
          fetchNextPage()
        }
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={
        <SafeAreaView edges={['bottom']}>
          {isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null}
        </SafeAreaView>
      }
      ListEmptyComponent={
        <Empty description={last(data?.pages)?.hidden_text} />
      }
    />
  )
})

const MemberReplies = forwardRef<
  FlatList,
  {
    contentContainerStyle: ViewStyle
    onScrollEnd: () => void
    onScroll: ScrollViewProps['onScroll']
  }
>(({ contentContainerStyle, onScroll, onScrollEnd }, ref) => {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

  useRemoveUnnecessaryPages({
    query: memberRepliesQuery,
    variables: { username: params.username },
  })

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseQuery({
      query: memberRepliesQuery,
      variables: { username: params.username },
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<
    (typeof data)['pages'][number]['list'][number]
  > = useCallback(({ item }) => <MemberReply key={item.id} topic={item} />, [])

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  return (
    <Animated.FlatList
      ref={ref}
      data={flatedData}
      onScroll={onScroll}
      onMomentumScrollEnd={onScrollEnd}
      onScrollEndDrag={onScrollEnd}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <StyledRefreshControl
          refreshing={isRefetchingByUser}
          onRefresh={refetchByUser}
          progressViewOffset={contentContainerStyle.paddingTop as number}
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
      ListFooterComponent={
        <SafeAreaView edges={['bottom']}>
          {isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null}
        </SafeAreaView>
      }
      ListEmptyComponent={<Empty description="目前还没有回复" />}
    />
  )
})

const MemberReply = memo(
  ({
    topic,
  }: {
    topic: Omit<Topic, 'replies'> & {
      reply: Reply
    }
  }) => {
    const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

    return (
      <DebouncedPressable
        key={topic.id}
        style={tw`px-4 py-3 bg-background`}
        onPress={() => {
          navigation.push('TopicDetail', topic)
        }}
      >
        <View style={tw`flex-row gap-2`}>
          <StyledButton
            size="mini"
            type="tag"
            onPress={() => {
              navigation.push('NodeTopics', { name: topic.node?.name! })
            }}
          >
            {topic.node?.title}
          </StyledButton>

          <Separator>
            <Text
              style={tw`text-foreground ${getFontSize(5)} font-semibold`}
              onPress={() => {
                navigation.push('MemberDetail', {
                  username: topic.member?.username!,
                })
              }}
            >
              {topic.member?.username}
            </Text>

            {!!topic.reply_count && (
              <Text style={tw`text-default ${getFontSize(5)}`}>
                {`${topic.reply_count} 回复`}
              </Text>
            )}
          </Separator>
        </View>

        <Text style={tw`text-foreground ${getFontSize(5)} pt-2`}>
          {topic.title}
        </Text>

        <View style={tw`bg-content px-4 py-3 mt-2 rounded`}>
          <Separator style={tw`mb-2`}>
            <Text style={tw`text-foreground ${getFontSize(5)}`}>
              {params.username}
            </Text>
            <Text style={tw`text-default ${getFontSize(5)}`}>
              {topic.reply.created}
            </Text>
          </Separator>
          <Html
            source={{ html: topic.reply.content }}
            defaultTextProps={{ selectable: false }}
          />
        </View>
      </DebouncedPressable>
    )
  },
  (prev, next) =>
    prev.topic.reply.content === next.topic.reply.content &&
    prev.topic.reply_count === next.topic.reply_count
)

function FollowMember({
  username,
  id,
  once,
  followed,
}: Pick<Member, 'username' | 'id' | 'once' | 'followed'>) {
  const { isMutating, trigger } = useMutation({
    mutation: followMemberMutation,
  })

  return (
    <StyledButton
      shape="rounded"
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isMutating) return
        if (!id || !once) return

        try {
          updateMember({
            username,
            followed: !followed,
          })

          await trigger({
            id,
            type: followed ? 'unfollow' : 'follow',
            once,
          })
        } catch (error) {
          updateMember({
            username,
            followed,
          })
          Toast.show({
            type: 'error',
            text1: '关注失败',
          })
        }
      }}
    >
      {followed ? `已关注` : `关注`}
    </StyledButton>
  )
}

function BlockMember({
  username,
  id,
  once,
  blocked,
}: Pick<Member, 'username' | 'id' | 'once' | 'blocked'>) {
  const { trigger, isMutating } = useMutation({
    mutation: blockMemberMutation,
  })

  return (
    <StyledButton
      shape="rounded"
      ghost
      textProps={{ style: tw`font-semibold` }}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isMutating) return
        if (!id || !once) return

        try {
          updateMember({
            username,
            blocked: !blocked,
          })

          await trigger({
            id,
            type: blocked ? 'unblock' : 'block',
            once,
          })

          if (blocked) {
            store.set(blackListAtom, prev => ({
              ...prev,
              blockers: prev.blockers.filter(o => o !== id),
            }))
          } else {
            store.set(blackListAtom, prev => ({
              ...prev,
              blockers: [...new Set([...prev.blockers, id])],
            }))
          }
        } catch (error) {
          updateMember({
            username,
            blocked,
          })
          Toast.show({
            type: 'error',
            text1: '操作失败',
          })
        }
      }}
    >
      {blocked ? `Unblock` : `Block`}
    </StyledButton>
  )
}

function MemberDetailSkeleton({ children }: { children: ReactNode }) {
  return (
    <View style={tw`flex-1 bg-background`}>
      <NavBar
        style={tw.style(TOP_BAR_BG_CLS)}
        tintColor="#fff"
        statusBarStyle="light"
      />
      <View
        style={tw.style(TOP_BAR_BG_CLS, `pt-10 px-4`, {
          marginTop: TAB_VIEW_MARGIN_TOP,
        })}
      />

      <View style={tw`-mt-8 px-4 flex-row`}>
        <View pointerEvents="none" style={tw`p-0.5 bg-background rounded-full`}>
          <View style={tw`w-[81.25px] h-[81.25px] rounded-full img-loading`} />
        </View>
      </View>
      {children}
    </View>
  )
}

function updateMember(member: Member) {
  queryClient.setQueryData(
    { query: memberQuery, variables: { username: member.username } },
    produce(data => {
      if (data) {
        Object.assign(data, member)
      }
    })
  )
}
