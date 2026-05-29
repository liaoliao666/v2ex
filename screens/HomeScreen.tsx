import { Feather } from '@expo/vector-icons'
import { InfiniteData } from '@tanstack/react-query'
import { useAtom, useAtomValue } from 'jotai'
import { findIndex, uniqBy } from 'lodash-es'
import {
  ReactNode,
  RefObject,
  createRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  FlatList,
  InteractionManager,
  ListRenderItem,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import Badge from '@/components/Badge'
import Drawer, { useDrawer } from '@/components/Drawer'
import Empty from '@/components/Empty'
import IconButton from '@/components/IconButton'
import NavBar, { NAV_BAR_HEIGHT, useNavBarHeight } from '@/components/NavBar'
import Profile from '@/components/Profile'
import {
  FallbackComponent,
  QuerySuspense,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RefetchingIndicator from '@/components/RefetchingIndicator'
import SearchBar from '@/components/SearchBar'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import BlockedTopicsNotice from '@/components/topic/BlockedTopicsNotice'
import TopicItem from '@/components/topic/TopicItem'
import XnaItem from '@/components/topic/XnaItem'
import {
  RECENT_TAB_KEY,
  XNA_KEY,
  homeTabIndexAtom,
  homeTabsAtom,
} from '@/jotai/homeTabsAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { fontScaleAtom, uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { Topic, Xna, k } from '@/servicies'
import { isSignined } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { isTablet, useTablet } from '@/utils/tablet'
import tw from '@/utils/tw'
import usePreviousDistinct from '@/utils/usePreviousDistinct'
import { useRefreshByUser } from '@/utils/useRefreshByUser'
import { useTopicBlockRules } from '@/utils/useTopicBlockRules'

const TAB_BAR_HEIGHT = 40
const HOME_LIST_PERFORMANCE_PROPS = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  updateCellsBatchingPeriod: 32,
  windowSize: 7,
  removeClippedSubviews: Platform.OS === 'android',
} as const
const errorResetMap: Record<string, () => void> = {}

type HomeListScrollProps = {
  onScroll: (event: any) => void
  scrollEventThrottle: number
  contentTopPadding: any
}

function topicKeyExtractor(item: Topic) {
  return String(item.id)
}

function xnaKeyExtractor(item: Xna) {
  return String(item.id)
}

function TabPlaceholder({
  children,
  headerHeight,
  tab,
}: {
  children: ReactNode
  headerHeight: any
  tab: string
}) {
  return (
    <QuerySuspense
      fallbackRender={fallbackProps => {
        errorResetMap[tab] = fallbackProps.resetErrorBoundary
        return (
          <Animated.View style={{ paddingTop: headerHeight }}>
            <FallbackComponent {...fallbackProps} />
          </Animated.View>
        )
      }}
      loading={
        <Animated.View style={{ paddingTop: headerHeight }}>
          <TopicPlaceholder />
        </Animated.View>
      }
    >
      {children}
    </QuerySuspense>
  )
}

export default withQuerySuspense(HomeScreen, {
  FallbackComponent: props => {
    const safeAreaInsets = useSafeAreaInsets()
    return (
      <View style={{ paddingTop: safeAreaInsets.top }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})

function HomeScreen() {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const fontScale = useAtomValue(fontScaleAtom)
  const tabs = useAtomValue(homeTabsAtom)
  const [index, setIndex] = useAtom(homeTabIndexAtom)
  const previousIndex = usePreviousDistinct(index)
  const { colors, fontSize } = useAtomValue(uiAtom)
  const tablet = useTablet()
  const layout = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()

  const navBarHeight = useNavBarHeight()
  const headerHeight = navBarHeight + TAB_BAR_HEIGHT
  const topBarCollapseY = useRef(new Animated.Value(0)).current
  const topBarCollapseValueRef = useRef(0)
  const activeRouteKeyRef = useRef(tabs[index]?.key)
  const routeScrollOffsetMapRef = useRef<Record<string, number>>({})
  const topBarTranslateY = topBarCollapseY.interpolate({
    inputRange: [0, NAV_BAR_HEIGHT],
    outputRange: [0, -NAV_BAR_HEIGHT],
    extrapolate: 'clamp',
  })
  const listContentTopPadding = useMemo(
    () => Animated.subtract(headerHeight, topBarCollapseY),
    [headerHeight, topBarCollapseY]
  )

  const updateTopBarCollapse = useCallback(
    (value: number) => {
      const nextValue = Math.max(0, Math.min(value, NAV_BAR_HEIGHT))
      if (topBarCollapseValueRef.current === nextValue) return

      topBarCollapseValueRef.current = nextValue
      topBarCollapseY.setValue(nextValue)
    },
    [topBarCollapseY]
  )

  const syncTopBarToRoute = useCallback(
    (routeKey: string, keepHidden = false) => {
      if (keepHidden && topBarCollapseValueRef.current >= NAV_BAR_HEIGHT - 1) {
        updateTopBarCollapse(NAV_BAR_HEIGHT)
        return
      }

      const offset = routeScrollOffsetMapRef.current[routeKey] || 0
      updateTopBarCollapse(offset < NAV_BAR_HEIGHT ? 0 : NAV_BAR_HEIGHT)
    },
    [updateTopBarCollapse]
  )

  const getHomeListScrollProps = useCallback(
    (routeKey: string): HomeListScrollProps => ({
      onScroll: event => {
        const rawOffset = event.nativeEvent.contentOffset.y
        const offset = Math.max(0, rawOffset)
        const previousOffset = routeScrollOffsetMapRef.current[routeKey] ?? 0
        const delta = rawOffset - previousOffset

        routeScrollOffsetMapRef.current[routeKey] = offset

        if (activeRouteKeyRef.current !== routeKey) return

        if (delta < 0 && rawOffset < NAV_BAR_HEIGHT) {
          updateTopBarCollapse(0)
          return
        }

        updateTopBarCollapse(topBarCollapseValueRef.current + delta)
      },
      scrollEventThrottle: 16,
      contentTopPadding: listContentTopPadding,
    }),
    [listContentTopPadding, updateTopBarCollapse]
  )

  useEffect(() => {
    const activeTabKey = tabs[index]?.key
    if (!activeTabKey) return

    activeRouteKeyRef.current = activeTabKey
    syncTopBarToRoute(activeTabKey, true)
  }, [index, syncTopBarToRoute, tabs])

  const [refs] = useState<Record<string, RefObject<FlatList>>>({})

  function handleInexChange(i: number, forceFetch = false) {
    const activeTab = tabs[i]
    if (!activeTab) return

    activeRouteKeyRef.current = activeTab.key
    syncTopBarToRoute(activeTab.key, true)
    setIndex(i)

    InteractionManager.runAfterInteractions(() => {
      handleActiveTabRefresh(activeTab, forceFetch)
    })
  }

  function handleActiveTabRefresh(
    activeTab: (typeof tabs)[number],
    forceFetch: boolean
  ) {
    const activeTabKey = activeTab.key
    const scrollActiveTabToTop = () => {
      routeScrollOffsetMapRef.current[activeTabKey] = 0
      refs[activeTabKey]?.current?.scrollToOffset({
        offset: 0,
      })

      if (activeRouteKeyRef.current === activeTabKey) {
        updateTopBarCollapse(0)
      }
    }
    const activeQueryKey: any =
      activeTab.type === 'node'
        ? k.node.topics.getKey({ name: activeTabKey })
        : activeTab.type === 'recent'
        ? k.topic.recent.getKey()
        : activeTab.type === 'xna'
        ? k.topic.xna.getKey()
        : k.topic.tab.getKey({ tab: activeTabKey })
    const query = queryClient.getQueryCache().find({
      queryKey: activeQueryKey,
    })

    if (query?.state.error) {
      errorResetMap[activeTabKey]?.()
    } else if (query?.getObserversCount() && (forceFetch || query?.isStale())) {
      if (
        activeTab.type === 'node' ||
        activeTab.type === 'recent' ||
        activeTab.type === 'xna'
      ) {
        const pages =
          (queryClient.getQueryData(activeQueryKey) as InfiniteData<any, any>)
            ?.pages?.length || 0

        if (forceFetch || pages > 1) {
          scrollActiveTabToTop()
        }

        queryClient.prefetchInfiniteQuery({
          ...(activeTab.type === 'node'
            ? k.node.topics.getFetchOptions({ name: activeTabKey })
            : activeTab.type === 'xna'
            ? (k.topic.xna.getFetchOptions() as any)
            : k.topic.recent.getFetchOptions()),
          pages: 1,
        })
      } else {
        if (forceFetch) {
          scrollActiveTabToTop()
        }

        queryClient.prefetchQuery(
          k.topic.tab.getFetchOptions({ tab: activeTabKey })
        )
      }
    }
  }

  const swipeEdgeWidth = Platform.OS === 'ios' ? 52 : 32

  return (
    <Drawer
      renderDrawerContent={() => <Profile />}
      drawerStyle={tablet.isTablet ? { width: tablet.navbarWidth } : undefined}
      swipeEdgeWidth={swipeEdgeWidth}
    >
      <TabView
        key={`${colorScheme}_${fontScale}`}
        navigationState={{ index, routes: tabs }}
        lazy
        lazyPreloadDistance={0}
        renderLazyPlaceholder={() => (
          <Animated.View style={{ paddingTop: listContentTopPadding }}>
            <TopicPlaceholder />
          </Animated.View>
        )}
        renderScene={({ route }) => {
          const routeIndex = tabs.indexOf(route)
          if (
            routeIndex !== previousIndex &&
            Math.abs(index - routeIndex) > 1
          ) {
            return (
              <Animated.View
                key={route.key}
                style={{ paddingTop: listContentTopPadding }}
              >
                <TopicPlaceholder />
              </Animated.View>
            )
          }

          const ref =
            refs[route.key] || (refs[route.key] = createRef<FlatList>() as any)

          if (route.type === 'node') {
            return (
              <TabPlaceholder
                headerHeight={listContentTopPadding}
                tab={route.key}
              >
                <NodeTopics
                  ref={ref}
                  headerHeight={headerHeight}
                  listScrollProps={getHomeListScrollProps(route.key)}
                  nodeName={route.key}
                />
              </TabPlaceholder>
            )
          }

          if (route.type === RECENT_TAB_KEY) {
            return (
              <TabPlaceholder
                headerHeight={listContentTopPadding}
                tab={RECENT_TAB_KEY}
              >
                <RecentTopics
                  ref={ref}
                  headerHeight={headerHeight}
                  listScrollProps={getHomeListScrollProps(route.key)}
                />
              </TabPlaceholder>
            )
          }

          if (route.type === XNA_KEY) {
            return (
              <TabPlaceholder
                headerHeight={listContentTopPadding}
                tab={XNA_KEY}
              >
                <Xnas
                  ref={ref}
                  headerHeight={headerHeight}
                  listScrollProps={getHomeListScrollProps(route.key)}
                />
              </TabPlaceholder>
            )
          }

          return (
            <TabPlaceholder
              headerHeight={listContentTopPadding}
              tab={route.key}
            >
              <TabTopics
                ref={ref}
                headerHeight={headerHeight}
                listScrollProps={getHomeListScrollProps(route.key)}
                tab={route.key}
              />
            </TabPlaceholder>
          )
        }}
        onIndexChange={handleInexChange}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <Animated.View
              style={{
                transform: [{ translateY: topBarTranslateY }],
              }}
            >
              <TopNavBar />
            </Animated.View>

            <Animated.View
              style={[
                tw`bg-[${colors.base100}] flex-row items-center border-b border-[${colors.divider}] border-solid h-[${TAB_BAR_HEIGHT}px] pl-4`,
                {
                  transform: [{ translateY: topBarTranslateY }],
                },
              ]}
            >
              <TabBar
                {...props}
                scrollEnabled
                style={tw`flex-row flex-1 shadow-none bg-transparent`}
                tabStyle={tw`w-auto h-[${TAB_BAR_HEIGHT}px]`}
                indicatorStyle={tw`bg-[${colors.foreground}] h-1 rounded-full`}
                indicatorContainerStyle={tw`border-b-0`}
                gap={16}
                renderTabBarItem={tabBarItemProps => {
                  const { route } = tabBarItemProps
                  const active = tabs[index].key === route.key

                  return (
                    <TouchableOpacity
                      {...tabBarItemProps}
                      key={route.key}
                      style={tw`w-auto items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        handleInexChange(
                          findIndex(tabs, { key: route.key }),
                          active
                        )
                      }}
                    >
                      <Text
                        style={tw.style(
                          fontSize.medium,
                          active
                            ? tw`text-[${colors.foreground}] font-medium`
                            : tw`text-[${colors.default}]`
                        )}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SortTabs')
                }}
                style={tw`h-full flex-row items-center justify-center z-50`}
              >
                <Feather
                  name="menu"
                  size={17}
                  color={colors.default}
                  style={tw`pr-4 pl-2`}
                />
              </TouchableOpacity>
            </Animated.View>

            <View
              pointerEvents="none"
              style={[
                tw`absolute top-0 inset-x-0 bg-[${colors.base100}]`,
                { height: safeAreaInsets.top },
              ]}
            />
          </View>
        )}
      />

      <View
        collapsable={false}
        style={tw`absolute left-0 bottom-0 top-[${headerHeight}px] w-[${swipeEdgeWidth}px]`}
      />
    </Drawer>
  )
}

const RecentTopics = memo(
  forwardRef<
    FlatList,
    { headerHeight: number; listScrollProps: HomeListScrollProps }
  >(({ headerHeight, listScrollProps }, ref) => {
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
      k.topic.recent.useSuspenseInfiniteQuery({
        refetchOnWindowFocus: () => isRefetchOnWindowFocus(RECENT_TAB_KEY),
      })
    const { contentTopPadding, ...scrollProps } = listScrollProps

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
      queryClient.prefetchInfiniteQuery({
        ...k.topic.recent.getFetchOptions(),
        pages: 1,
      })
    )

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem topic={item} />,
      []
    )

    const flatedData = useMemo(
      () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
      [data.pages]
    )
    const { visibleTopics, blockedTopics } = useTopicBlockRules(flatedData)

    return (
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser && !isFetchingNextPage}
        progressViewOffset={headerHeight}
      >
        <Animated.FlatList
          ref={ref as any}
          data={visibleTopics}
          keyExtractor={topicKeyExtractor}
          {...HOME_LIST_PERFORMANCE_PROPS}
          {...scrollProps}
          automaticallyAdjustsScrollIndicatorInsets={false}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          ItemSeparatorComponent={LineSeparator}
          ListHeaderComponent={
            <>
              <Animated.View style={{ height: contentTopPadding }} />
              <BlockedTopicsNotice
                blockedTopics={blockedTopics}
                sourceTitle="最近"
              />
            </>
          }
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
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
        />
      </RefetchingIndicator>
    )
  })
)

const TabTopics = memo(
  forwardRef<
    FlatList,
    {
      tab: string
      headerHeight: number
      listScrollProps: HomeListScrollProps
    }
  >(({ tab, headerHeight, listScrollProps }, ref) => {
    const { data, refetch, isFetching } = k.topic.tab.useSuspenseQuery({
      variables: { tab },
      refetchOnWindowFocus: () => isRefetchOnWindowFocus(tab),
    })
    const { contentTopPadding, ...scrollProps } = listScrollProps

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem topic={item} />,
      []
    )

    const { visibleTopics, blockedTopics } = useTopicBlockRules(data)

    return (
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser}
        progressViewOffset={headerHeight}
      >
        <Animated.FlatList
          ref={ref as any}
          data={visibleTopics}
          keyExtractor={topicKeyExtractor}
          {...HOME_LIST_PERFORMANCE_PROPS}
          {...scrollProps}
          automaticallyAdjustsScrollIndicatorInsets={false}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          ItemSeparatorComponent={LineSeparator}
          ListHeaderComponent={
            <>
              <Animated.View style={{ height: contentTopPadding }} />
              <BlockedTopicsNotice
                blockedTopics={blockedTopics}
                sourceTitle={tab}
              />
            </>
          }
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
          renderItem={renderItem}
          ListEmptyComponent={<Empty description="目前还没有主题" />}
        />
      </RefetchingIndicator>
    )
  })
)

const NodeTopics = memo(
  forwardRef<
    FlatList,
    {
      nodeName: string
      headerHeight: number
      listScrollProps: HomeListScrollProps
    }
  >(({ nodeName, headerHeight, listScrollProps }, ref) => {
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
      k.node.topics.useSuspenseInfiniteQuery({
        variables: { name: nodeName },
        refetchOnWindowFocus: () => isRefetchOnWindowFocus(nodeName),
      })
    const { contentTopPadding, ...scrollProps } = listScrollProps

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
      queryClient.prefetchInfiniteQuery({
        ...k.node.topics.getFetchOptions({ name: nodeName }),
        pages: 1,
      })
    )

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem topic={item} />,
      []
    )

    const flatedData = useMemo(
      () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
      [data.pages]
    )
    const { visibleTopics, blockedTopics } = useTopicBlockRules(flatedData)

    return (
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser && !isFetchingNextPage}
        progressViewOffset={headerHeight}
      >
        <Animated.FlatList
          ref={ref as any}
          data={visibleTopics}
          keyExtractor={topicKeyExtractor}
          {...HOME_LIST_PERFORMANCE_PROPS}
          {...scrollProps}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          ListEmptyComponent={<Empty description="无法访问该节点" />}
          ItemSeparatorComponent={LineSeparator}
          ListHeaderComponent={
            <>
              <Animated.View style={{ height: contentTopPadding }} />
              <BlockedTopicsNotice
                blockedTopics={blockedTopics}
                sourceTitle={nodeName}
              />
            </>
          }
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
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
        />
      </RefetchingIndicator>
    )
  })
)

const Xnas = memo(
  forwardRef<
    FlatList,
    { headerHeight: number; listScrollProps: HomeListScrollProps }
  >(({ headerHeight, listScrollProps }, ref) => {
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
      k.topic.xna.useSuspenseInfiniteQuery({
        refetchOnWindowFocus: () => isRefetchOnWindowFocus(XNA_KEY),
      })
    const { contentTopPadding, ...scrollProps } = listScrollProps

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
      queryClient.prefetchInfiniteQuery({
        ...k.topic.recent.getFetchOptions(),
        pages: 1,
      })
    )

    const renderItem: ListRenderItem<Xna> = useCallback(
      ({ item }) => <XnaItem xna={item} />,
      []
    )

    const flatedData = useMemo(
      () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
      [data.pages]
    )

    return (
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser && !isFetchingNextPage}
        progressViewOffset={headerHeight}
      >
        <Animated.FlatList
          ref={ref as any}
          data={flatedData}
          keyExtractor={xnaKeyExtractor}
          {...HOME_LIST_PERFORMANCE_PROPS}
          {...scrollProps}
          automaticallyAdjustsScrollIndicatorInsets={false}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          ItemSeparatorComponent={LineSeparator}
          ListHeaderComponent={
            <Animated.View style={{ height: contentTopPadding }} />
          }
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
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
        />
      </RefetchingIndicator>
    )
  })
)

function TopNavBar() {
  const profile = useAtomValue(profileAtom)

  const { colors } = useAtomValue(uiAtom)

  const [, setOpenDrawer] = useDrawer()

  return (
    <NavBar
      disableStatusBarStyle={isTablet()}
      style={tw`bg-[${colors.base100}] border-b-0`}
      left={
        <Pressable
          onPress={() => {
            setOpenDrawer(prev => !prev)
          }}
        >
          {profile ? (
            <Badge content={profile.my_notification}>
              <StyledImage
                priority="high"
                style={tw`w-8 h-8 rounded-full`}
                source={profile.avatar}
              />
            </Badge>
          ) : (
            <View
              style={tw`w-8 h-8 items-center justify-center rounded-full bg-[${colors.neutral}]`}
            />
          )}
        </Pressable>
      }
      right={
        <IconButton
          name="note-edit-outline"
          size={24}
          color={colors.foreground}
          activeColor={colors.foreground}
          onPress={() => {
            if (!isSignined()) {
              navigation.navigate('Login')
              return
            }
            navigation.navigate('WriteTopic', {})
          }}
        />
      }
    >
      <SearchBar
        style={tw`flex-1`}
        editable={false}
        onPress={() => {
          navigation.navigate('Search', {})
        }}
      />
    </NavBar>
  )
}

function isRefetchOnWindowFocus(key: string) {
  const isActive =
    findIndex(store.get(homeTabsAtom), { key }) === store.get(homeTabIndexAtom)
  return isActive && (getCurrentRouteName() === 'Home' || isTablet())
}
