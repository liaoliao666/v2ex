import { Feather } from '@expo/vector-icons'
import { DrawerActions } from '@react-navigation/native'
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
  useMemo,
  useState,
} from 'react'
import {
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import Badge from '@/components/Badge'
import Empty from '@/components/Empty'
import IconButton from '@/components/IconButton'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  QuerySuspense,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RefetchingIndicator from '@/components/RefetchingIndicator'
import SearchBar from '@/components/SearchBar'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import TopicItem from '@/components/topic/TopicItem'
import { homeTabIndexAtom, homeTabsAtom } from '@/jotai/homeTabsAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { fontScaleAtom, uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import { isSignined } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { isLargeTablet, useIsTablet } from '@/utils/tablet'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 40
const RECENT_TAB_KEY = 'recent'
const errorResetMap: Record<string, () => void> = {}

function TabPlaceholder({
  children,
  tab,
}: {
  children: ReactNode
  tab: string
}) {
  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
  return (
    <QuerySuspense
      fallbackRender={fallbackProps => {
        errorResetMap[tab] = fallbackProps.resetErrorBoundary
        return (
          <View style={{ paddingTop: headerHeight }}>
            <FallbackComponent {...fallbackProps} />
          </View>
        )
      }}
      loading={<TopicPlaceholder style={{ paddingTop: headerHeight }} />}
    >
      {children}
    </QuerySuspense>
  )
}

export default withQuerySuspense(HomeScreen, {
  fallbackRender: props => (
    <SafeAreaView edges={['top']}>
      <FallbackComponent {...props} />
    </SafeAreaView>
  ),
})

function HomeScreen() {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const fontScale = useAtomValue(fontScaleAtom)
  const tabs = useAtomValue(homeTabsAtom)
  const [index, setIndex] = useAtom(homeTabIndexAtom)
  const { colors, fontSize } = useAtomValue(uiAtom)

  const layout = useWindowDimensions()

  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT

  const [refs] = useState<Record<string, RefObject<FlatList>>>({})

  function handleInexChange(i: number, forceFetch = false) {
    const activeTab = tabs[i]
    const activeTabKey = activeTab.key
    const activeQueryKey: any =
      activeTab.type === 'node'
        ? k.node.topics.getKey({ name: activeTabKey })
        : activeTabKey === RECENT_TAB_KEY
        ? k.topic.recent.getKey()
        : k.topic.tab.getKey({ tab: activeTabKey })
    const query = queryClient.getQueryCache().find({
      queryKey: activeQueryKey,
    })

    if (query?.state.error) {
      errorResetMap[activeTabKey]?.()
    } else if (query?.getObserversCount() && (forceFetch || query?.isStale())) {
      if (activeTab.type === 'node' || activeTabKey === RECENT_TAB_KEY) {
        const pages =
          (queryClient.getQueryData(activeQueryKey) as InfiniteData<any, any>)
            ?.pages?.length || 0

        if (forceFetch || pages > 1) {
          refs[activeTabKey]?.current?.scrollToOffset({
            offset: 0,
          })
        }

        queryClient.prefetchInfiniteQuery({
          ...(activeTab.type === 'node'
            ? k.node.topics.getFetchOptions({ name: activeTabKey })
            : k.topic.recent.getFetchOptions()),
          pages: 1,
        })
      } else {
        if (forceFetch) {
          refs[activeTabKey]?.current?.scrollToOffset({
            offset: 0,
          })
        }

        queryClient.prefetchQuery(
          k.topic.tab.getFetchOptions({ tab: activeTabKey })
        )
      }
    }

    setIndex(i)
  }

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <TabView
        key={`${colorScheme}_${fontScale}`}
        navigationState={{ index, routes: tabs }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          const ref =
            refs[route.key] || (refs[route.key] = createRef<FlatList>())

          if (route.type === 'node') {
            return (
              <TabPlaceholder tab={route.key}>
                <NodeTopics
                  ref={ref}
                  headerHeight={headerHeight}
                  nodeName={route.key}
                />
              </TabPlaceholder>
            )
          }

          if (route.key === RECENT_TAB_KEY) {
            return (
              <TabPlaceholder tab={RECENT_TAB_KEY}>
                <RecentTopics ref={ref} headerHeight={headerHeight} />
              </TabPlaceholder>
            )
          }

          return (
            <TabPlaceholder tab={route.key}>
              <TabTopics
                ref={ref}
                headerHeight={headerHeight}
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
            <StyledBlurView style={tw`absolute inset-0`} />

            <TopNavBar />

            <View
              style={tw`flex-row items-center border-b border-[${colors.divider}] border-solid h-[${TAB_BAR_HEIGHT}px] pl-4`}
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
            </View>
          </View>
        )}
      />

      <PreventLeftSwiping headerHeight={headerHeight} />
    </View>
  )
}

const RecentTopics = memo(
  forwardRef<FlatList, { headerHeight: number }>(({ headerHeight }, ref) => {
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
      k.topic.recent.useSuspenseInfiniteQuery({
        refetchOnWindowFocus: () => isRefetchOnWindowFocus(RECENT_TAB_KEY),
      })

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
      queryClient.prefetchInfiniteQuery({
        ...k.topic.recent.getFetchOptions(),
        pages: 1,
      })
    )

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem key={item.id} topic={item} />,
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
        <FlatList
          ref={ref}
          data={flatedData}
          automaticallyAdjustsScrollIndicatorInsets={false}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          contentContainerStyle={{
            paddingTop: headerHeight,
          }}
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
    }
  >(({ tab, headerHeight }, ref) => {
    const { data, refetch, isFetching } = k.topic.tab.useSuspenseQuery({
      variables: { tab },
      refetchOnWindowFocus: () => isRefetchOnWindowFocus(tab),
    })

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem key={item.id} topic={item} />,
      []
    )

    return (
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser}
        progressViewOffset={headerHeight}
      >
        <FlatList
          ref={ref}
          data={data}
          automaticallyAdjustsScrollIndicatorInsets={false}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          contentContainerStyle={{
            paddingTop: headerHeight,
          }}
          ItemSeparatorComponent={LineSeparator}
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
    }
  >(({ nodeName, headerHeight }, ref) => {
    const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
      k.node.topics.useSuspenseInfiniteQuery({
        variables: { name: nodeName },
        refetchOnWindowFocus: () => isRefetchOnWindowFocus(nodeName),
      })

    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
      queryClient.prefetchInfiniteQuery({
        ...k.node.topics.getFetchOptions({ name: nodeName }),
        pages: 1,
      })
    )

    const renderItem: ListRenderItem<Topic> = useCallback(
      ({ item }) => <TopicItem key={item.id} topic={item} />,
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
        <FlatList
          ref={ref}
          data={flatedData}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={headerHeight}
            />
          }
          contentContainerStyle={{
            paddingTop: headerHeight,
          }}
          ListEmptyComponent={<Empty description="无法访问该节点" />}
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
        />
      </RefetchingIndicator>
    )
  })
)

function TopNavBar() {
  const profile = useAtomValue(profileAtom)

  const isTablet = useIsTablet()

  const { colors } = useAtomValue(uiAtom)

  return (
    <NavBar
      style={tw`border-b-0`}
      left={
        !isTablet && (
          <Pressable
            onPress={() => {
              navigation.dispatch(DrawerActions.openDrawer)
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
        )
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

function PreventLeftSwiping({ headerHeight }: { headerHeight: number }) {
  return (
    <View style={tw`absolute left-0 bottom-0 top-[${headerHeight}px] w-6`} />
  )
}

function isRefetchOnWindowFocus(key: string) {
  const isActive =
    findIndex(store.get(homeTabsAtom), { key }) === store.get(homeTabIndexAtom)
  return isActive && (getCurrentRouteName() === 'Home' || isLargeTablet())
}
