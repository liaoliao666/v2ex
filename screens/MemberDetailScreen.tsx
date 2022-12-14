import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import produce from 'immer'
import { useAtomValue } from 'jotai'
import { every, findIndex, last, pick, some, uniqBy } from 'lodash-es'
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
  Linking,
  ListRenderItem,
  NativeScrollEvent,
  Pressable,
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
import { inferData } from 'react-query-kit'

import DebouncePressable from '@/components/DebouncePressable'
import Html from '@/components/Html'
import LoadingIndicator from '@/components/LoadingIndicator'
import Money from '@/components/Money'
import NavBar, { NAV_BAR_HEIGHT } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import Separator, { LineSeparator } from '@/components/Separator'
import Space from '@/components/Space'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicItem from '@/components/topic/TopicItem'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import {
  useBlockMember,
  useFollowMember,
  useMember,
  useMemberReplies,
  useMemberTopics,
} from '@/servicies/member'
import { Member, Reply, Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import useMount from '@/utils/useMount'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const topBarBgCls = `bg-[#333344]`

export default withQuerySuspense(MemberDetailScreen, {
  Loading: () => (
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

  useMount(() => {
    queryClient.prefetchQuery(
      useMemberTopics.getKey({ username: params.username }),
      useMemberTopics.queryFn
    )
    queryClient.prefetchQuery(
      useMemberReplies.getKey({ username: params.username }),
      useMemberReplies.queryFn
    )
  })

  const { data: member } = useMember({
    variables: { username: params.username },
    suspense: true,
  })

  const layout = useWindowDimensions()

  const [routes] = useState(() => [
    {
      title: '??????',
      key: 'MemberTopics',
      scrollY: 0,
      ref: createRef<FlatList>(),
    },
    {
      title: '??????',
      key: 'MemberReplies',
      scrollY: 0,
      ref: createRef<FlatList>(),
    },
  ])

  const [index, setIndex] = useState(0)

  const [headerHeight, setHeaderHeight] = useState(0)

  const [avatarVisible, setAvatarVisible] = useState(true)

  const scrollYRef = useRef(new Animated.Value(0))

  const colorScheme = useAtomValue(colorSchemeAtom)

  const pofile = useAtomValue(profileAtom)

  const isSelf = pofile?.username === params.username

  return (
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar
        style={tw.style(topBarBgCls)}
        tintColor="#fff"
        statusBarStyle="light"
      >
        {!avatarVisible && !isSelf && (
          <View style={tw`flex-row items-center flex-1`}>
            <Text style={tw`text-white text-body-4 font-bold mr-auto`}>
              {member?.username}
            </Text>

            <FollowMember {...member!} />
          </View>
        )}
      </NavBar>

      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          const senceProps = {
            ref: route.ref,
            contentContainerStyle: {
              paddingTop: headerHeight ? headerHeight + NAV_BAR_HEIGHT : 0,
              minHeight: layout.height,
            },
            onScroll: Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollYRef.current } } }],
              {
                useNativeDriver: true,
                listener(ev) {
                  route.scrollY = (
                    ev.nativeEvent as NativeScrollEvent
                  ).contentOffset.y
                  setAvatarVisible(route.scrollY < 130)
                },
              }
            ),
            onScrollEnd: () => {
              const currentRoute = routes[index]
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
                        translateY: scrollYRef.current.interpolate({
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
                style={tw`bg-body-1`}
              >
                <MemberHeader isSelf={isSelf} />
              </View>

              <TabBar
                {...props}
                scrollEnabled
                style={tw`bg-body-1 flex-row shadow-none border-b border-tint-border border-solid`}
                tabStyle={tw`w-[80px] h-[${NAV_BAR_HEIGHT}px]`}
                indicatorStyle={tw`w-[40px] ml-[20px] bg-primary h-1 rounded-full`}
                renderTabBarItem={({ route }) => {
                  const active = routes[index].key === route.key

                  return (
                    <Pressable
                      key={route.key}
                      style={({ pressed }) =>
                        tw.style(
                          `w-[80px] items-center p-4 h-[${NAV_BAR_HEIGHT}px]`,
                          pressed && tw`bg-tab-press`
                        )
                      }
                      onPress={() => {
                        setIndex(findIndex(routes, { key: route.key }))
                      }}
                    >
                      <Text
                        style={tw.style(
                          active
                            ? tw`text-tint-primary font-medium`
                            : tw`text-tint-secondary`
                        )}
                      >
                        {route.title}
                      </Text>
                    </Pressable>
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

const MemberHeader = memo(({ isSelf }: { isSelf: boolean }) => {
  const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

  const { data: member } = useMember({
    variables: { username: params.username },
  })

  return (
    <Fragment>
      <View pointerEvents="none" style={tw.style(topBarBgCls, `pt-10 px-4`)} />

      <View style={tw`-mt-8 px-4 flex-row`}>
        <View pointerEvents="none" style={tw`p-0.5 bg-body-1 rounded-full`}>
          <StyledImage
            style={tw`w-[81.25px] h-[81.25px] rounded-full`}
            source={{
              uri: member?.avatar,
            }}
          />
        </View>

        {!isSelf && (
          <Space style={tw`mt-10 ml-auto flex-row`}>
            <BlockMember {...member!} />

            <FollowMember {...member!} />
          </Space>
        )}
      </View>

      <Space
        pointerEvents="none"
        direction="vertical"
        gap={4}
        style={tw`mt-3 px-4`}
      >
        <Space style={tw`items-center`}>
          <Text style={tw`text-tint-primary text-body-2 font-extrabold`}>
            {member?.username}
          </Text>

          <Space pointerEvents="none" style={tw`items-center`}>
            <View style={tw`rounded-full overflow-hidden`}>
              <Svg height="100%" width="100%" style={tw`absolute inset-0`}>
                <Defs>
                  {/* @ts-ignore */}
                  <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0" stopColor={'#52bf1c'} />
                    <Stop offset="1" stopColor={'#438906'} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#grad)" />
              </Svg>
              <Text
                style={tw`px-1 py-0.5 text-white text-body-6 font-medium text-center`}
              >
                ONLINE
              </Text>
            </View>

            <Money {...pick(member, ['gold', 'silver', 'bronze'])} />
          </Space>
        </Space>

        {!!member?.motto && (
          <View pointerEvents="none">
            <Text style={tw`text-tint-secondary text-body-5`}>
              {member?.motto}
            </Text>
          </View>
        )}

        {some([member?.company, member?.title]) && (
          <View style={tw`flex-row flex-wrap`}>
            {member?.company && (
              <Text style={tw`font-bold text-tint-primary text-body-5`}>
                ???? {member.company}
              </Text>
            )}
            {every([member?.company, member?.title]) && (
              <Text style={tw`text-tint-secondary text-body-5 px-1`}>/</Text>
            )}
            {member?.title && (
              <Text style={tw`text-tint-secondary text-body-5 flex-1`}>
                {member.title}
              </Text>
            )}
          </View>
        )}

        <Text style={tw`text-tint-secondary text-body-5`}>
          {`V2EX ??? ${member?.id} ????????????????????? ${member?.created}`}
        </Text>

        <Text style={tw`text-tint-secondary text-body-5`}>
          {`????????????????????? ${member?.activity}`}
        </Text>

        {!!member?.overview && (
          <View style={tw`border-t border-solid border-tint-border pt-2`}>
            <Html source={{ html: member.overview }} />
          </View>
        )}
      </Space>

      {!!member?.widgets?.length && (
        <Space wrap style={tw`mt-2 px-4`} pointerEvents="box-none">
          {member.widgets.map(widget => (
            <TouchableOpacity
              key={widget.link}
              style={tw`bg-[#f0f3f5] dark:bg-[#262626] rounded-full py-1.5 pl-2 pr-2.5 flex-row items-center`}
              onPress={async () => {
                const supported = await Linking.canOpenURL(widget.link)

                if (supported) {
                  await Linking.openURL(widget.link)
                } else {
                  Toast.show({
                    type: 'error',
                    text1: '??????????????????',
                  })
                }
              }}
            >
              <StyledImage
                style={tw`w-5 h-5 mr-1`}
                source={{
                  uri: widget.uri,
                }}
              />
              <Text style={tw`text-body-5 text-tint-secondary`}>
                {widget.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Space>
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

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMemberTopics({
      variables: { username: params.username },
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} hideAvatar />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
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
        <View style={tw`items-center justify-center py-16`}>
          <Text style={tw`text-tint-secondary text-body-6`}>
            {last(data?.pages)?.hidden ? '?????????????????????' : '?????????????????????'}
          </Text>
        </View>
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

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMemberReplies({
      variables: { username: params.username },
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<
    Omit<Topic, 'replies'> & {
      reply: Reply
    }
  > = useCallback(({ item }) => <MemberReply key={item.id} topic={item} />, [])

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
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
      ListEmptyComponent={
        <View style={tw`items-center justify-center py-16`}>
          <Text style={tw`text-tint-secondary text-body-6`}>
            ?????????????????????
          </Text>
        </View>
      }
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
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    const { params } = useRoute<RouteProp<RootStackParamList, 'MemberDetail'>>()

    return (
      <DebouncePressable
        key={topic.id}
        style={tw`px-4 py-3 bg-body-1`}
        onPress={() => {
          navigation.push('TopicDetail', topic)
        }}
      >
        <Space style={tw`items-center`}>
          <StyledButton
            size="mini"
            type="tag"
            onPress={() => {
              navigation.push('NodeTopics', { name: topic.node?.name! })
            }}
          >
            {topic.node?.title}
          </StyledButton>

          <Separator style={tw`items-center`}>
            <Text style={tw`text-tint-primary text-body-5 font-bold`}>
              {topic.member?.username}
            </Text>

            {!!topic.reply_count && (
              <Text style={tw`text-tint-secondary text-body-5`}>
                {`${topic.reply_count} ??????`}
              </Text>
            )}
          </Separator>
        </Space>

        <Text style={tw`text-tint-primary text-body-5 pt-2`}>
          {topic.title}
        </Text>

        <View style={tw`bg-[#f0f3f5] dark:bg-[#262626] px-4 py-3 mt-2 rounded`}>
          <Separator style={tw`mb-2`}>
            <Text style={tw`text-tint-primary text-body-5`}>
              {params.username}
            </Text>
            <Text style={tw`text-tint-secondary text-body-5`}>
              {topic.reply.created}
            </Text>
          </Separator>
          <Html source={{ html: topic.reply.content }} />
        </View>
      </DebouncePressable>
    )
  }
)

function FollowMember({
  username,
  id,
  once,
  followed,
}: Pick<Member, 'username' | 'id' | 'once' | 'followed'>) {
  const { mutateAsync, isLoading } = useFollowMember()

  const navigation = useNavigation()

  return (
    <StyledButton
      shape="rounded"
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isLoading) return
        if (!id || !once) return

        try {
          updateMember({
            username,
            followed: !followed,
          })

          await mutateAsync({
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
            text1: '????????????',
          })
        }
      }}
    >
      {followed ? `?????????` : `??????`}
    </StyledButton>
  )
}

function BlockMember({
  username,
  id,
  once,
  blocked,
}: Pick<Member, 'username' | 'id' | 'once' | 'blocked'>) {
  const { mutateAsync, isLoading } = useBlockMember()

  const navigation = useNavigation()

  return (
    <StyledButton
      shape="rounded"
      ghost
      textProps={{ style: tw`font-bold` }}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isLoading) return
        if (!id || !once) return

        try {
          updateMember({
            username,
            blocked: !blocked,
          })

          await mutateAsync({
            id,
            type: blocked ? 'unblock' : 'block',
            once,
          })
        } catch (error) {
          updateMember({
            username,
            blocked,
          })
          Toast.show({
            type: 'error',
            text1: '????????????',
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
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar
        style={tw.style(topBarBgCls)}
        tintColor="#fff"
        statusBarStyle="light"
      />
      <View style={tw.style(topBarBgCls, `pt-10 px-4`)} />

      <View style={tw`-mt-8 px-4 flex-row`}>
        <View pointerEvents="none" style={tw`p-0.5 bg-body-1 rounded-full`}>
          <View style={tw`w-[81.25px] h-[81.25px] rounded-full bg-loading`} />
        </View>
      </View>
      {children}
    </View>
  )
}

function updateMember(member: Member) {
  queryClient.setQueryData<inferData<typeof useMember>>(
    useMember.getKey({ username: member.username }),
    produce(data => {
      if (data) {
        Object.assign(data, member)
      }
    })
  )
}
