import { Feather } from '@expo/vector-icons'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtom, useAtomValue } from 'jotai'
import { findIndex, uniqBy } from 'lodash-es'
import { ComponentProps, ReactNode, memo, useCallback, useMemo } from 'react'
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
import { isTabletAtom } from '@/jotai/deviceTypeAtom'
import { fontScaleAtom, getFontSize } from '@/jotai/fontSacleAtom'
import { homeTabIndexAtom, homeTabsAtom } from '@/jotai/homeTabsAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { getCurrentRouteName } from '@/navigation/navigationRef'
import { useNodeTopics } from '@/servicies/node'
import { useRecentTopics, useTabTopics } from '@/servicies/topic'
import { Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { queryClient, removeUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 40

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

const MemoRecentTopics = memo((props: ComponentProps<typeof RecentTopics>) => (
  <TabPlaceholder tab="recent">
    <RecentTopics {...props} />
  </TabPlaceholder>
))

const MemoTabTopics = memo((props: ComponentProps<typeof TabTopics>) => (
  <TabPlaceholder tab={props.tab}>
    <TabTopics {...props} />
  </TabPlaceholder>
))

const MemoNodeTopics = memo((props: ComponentProps<typeof NodeTopics>) => (
  <TabPlaceholder tab={props.nodeName}>
    <NodeTopics {...props} />
  </TabPlaceholder>
))

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

  const layout = useWindowDimensions()

  const [index, setIndex] = useAtom(homeTabIndexAtom)

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT

  function handleInexChange(i: number) {
    const activeTab = tabs[i]
    const activeTabKey = tabs[i].key
    const activeQueryKey =
      tabs[i].type === 'node'
        ? useNodeTopics.getKey({ name: activeTabKey })
        : tabs[i].key === 'recent'
        ? useRecentTopics.getKey()
        : useTabTopics.getKey({ tab: activeTabKey })
    const query = queryClient.getQueryCache().find({
      queryKey: activeQueryKey,
    })

    if (query?.state.error) {
      errorResetMap[activeTabKey]?.()
    } else if (query?.getObserversCount() && query?.isStale()) {
      if (activeTabKey === 'recent') {
        removeUnnecessaryPages(useRecentTopics.getKey())
      } else if (activeTab.type === 'node') {
        removeUnnecessaryPages(useNodeTopics.getKey({ name: activeTabKey }))
      }
      queryClient.refetchQueries({ queryKey: activeQueryKey })
    }

    setIndex(i)
  }

  return (
    <View style={tw`flex-1 bg-body-1`}>
      <TabView
        key={`${colorScheme}_${fontScale}`}
        navigationState={{ index, routes: tabs }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          const isActive = index === findIndex(tabs, { key: route.key })
          if (route.type === 'node')
            return (
              <MemoNodeTopics
                isActive={isActive}
                headerHeight={headerHeight}
                nodeName={route.key}
              />
            )
          return route.key === 'recent' ? (
            <MemoRecentTopics isActive={isActive} headerHeight={headerHeight} />
          ) : (
            <MemoTabTopics
              isActive={isActive}
              headerHeight={headerHeight}
              tab={route.key}
            />
          )
        }}
        onIndexChange={handleInexChange}
        initialLayout={{
          width: layout.width,
        }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <TopNavBar />

            <View
              style={tw`flex-row items-center border-b border-tint-border border-solid`}
            >
              <TabBar
                {...props}
                scrollEnabled
                style={tw`flex-row flex-1 shadow-none bg-transparent`}
                tabStyle={tw`w-[60px] h-[${TAB_BAR_HEIGHT}px]`}
                indicatorStyle={tw`w-[30px] ml-[15px] bg-primary h-1 rounded-full`}
                indicatorContainerStyle={tw`border-b-0`}
                renderTabBarItem={({ route }) => {
                  const active = tabs[index].key === route.key

                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={tw`w-[60px] items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        handleInexChange(findIndex(tabs, { key: route.key }))
                      }}
                    >
                      <Text
                        style={tw.style(
                          getFontSize(5),
                          active
                            ? tw`text-tint-primary font-medium`
                            : tw`text-tint-secondary`
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
                  color={tw.color(`text-tint-secondary`)}
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

function RecentTopics({
  isActive,
  headerHeight,
}: {
  isActive: boolean
  headerHeight: number
}) {
  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useRecentTopics({
    refetchOnWindowFocus: () => isActive && getCurrentRouteName() === 'Home',
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

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
}

function TabTopics({
  tab,
  isActive,
  headerHeight,
}: {
  tab: string
  isActive: boolean
  headerHeight: number
}) {
  const { data, refetch, isFetching } = useTabTopics({
    variables: { tab },
    refetchOnWindowFocus: () => isActive && getCurrentRouteName() === 'Home',
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
}

function NodeTopics({
  nodeName,
  isActive,
  headerHeight,
}: {
  nodeName: string
  isActive: boolean
  headerHeight: number
}) {
  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useNodeTopics({
    variables: { name: nodeName },
    refetchOnWindowFocus: () => isActive && getCurrentRouteName() === 'Home',
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

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
}

function TopNavBar() {
  const profile = useAtomValue(profileAtom)

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const isTablet = useAtomValue(isTabletAtom)

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
                  style={tw`w-8 h-8 rounded-full`}
                  source={{
                    uri: profile.avatar,
                  }}
                />
              </Badge>
            ) : (
              <View
                style={tw`w-8 h-8 items-center justify-center rounded-full img-loading`}
              />
            )}
          </Pressable>
        )
      }
      right={
        <IconButton
          name="note-edit-outline"
          size={24}
          color={tw.color(`text-tint-secondary`)}
          activeColor={tw.color(`text-tint-primary`)}
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
          navigation.push('Search', {})
        }}
      />
    </NavBar>
  )
}

function PreventLeftSwiping({ headerHeight }: { headerHeight: number }) {
  return (
    <View style={tw`absolute left-0 bottom-0 top-[${headerHeight}px] w-5`} />
  )
}
