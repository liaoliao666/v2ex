import { useAtomValue } from 'jotai'
import { findIndex, last, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import Empty from '@/components/Empty'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RefetchingIndicator from '@/components/RefetchingIndicator'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import TopicItem from '@/components/topic/TopicItem'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { Topic, k } from '@/servicies'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 40

export default withQuerySuspense(MyFollowingScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="特别关注" />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="特别关注" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoMyFollowing = withQuerySuspense(memo(MyFollowing), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})
const MemoMemberTopics = withQuerySuspense(memo(MemberTopics), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
  LoadingComponent: () => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <TopicPlaceholder hideAvatar />
      </View>
    )
  },
})

function MyFollowingScreen() {
  const { data } = k.my.following.useSuspenseInfiniteQuery()

  const following = last(data.pages)?.following

  const routes = useMemo(() => {
    return [
      { title: '全部关注', key: 'all', avatar: undefined },
      ...(following?.map(member => ({
        title: member.username,
        key: member.username,
        avatar: member.avatar,
      })) || []),
    ]
  }, [following])

  const [index, setIndex] = useState(0)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const layout = useWindowDimensions()

  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          if (Math.abs(index - routes.indexOf(route)) > 1) {
            return <View />
          }

          return route.key === 'all' ? (
            <MemoMyFollowing headerHeight={headerHeight} />
          ) : (
            <MemoMemberTopics
              headerHeight={headerHeight}
              username={route.key}
            />
          )
        }}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <NavBar title="特别关注" style={tw`border-b-0`} />

            <View
              style={tw`px-4 border-b border-[${colors.divider}] border-solid h-[${TAB_BAR_HEIGHT}px]`}
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
                  const active = routes[index].key === route.key

                  return (
                    <TouchableOpacity
                      {...tabBarItemProps}
                      key={route.key}
                      style={tw`w-auto flex-row items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        setIndex(findIndex(routes, { key: route.key }))
                      }}
                    >
                      {route.avatar && (
                        <StyledImage
                          style={tw`w-5 h-5 mr-2 rounded-full`}
                          source={route.avatar}
                        />
                      )}
                      <Text
                        style={tw.style(
                          fontSize.medium,
                          `flex-shrink`,
                          active
                            ? tw`text-[${colors.foreground}] font-semibold`
                            : tw`text-[${colors.default}] font-medium`
                        )}
                        numberOfLines={1}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
          </View>
        )}
      />
    </View>
  )
}

function MyFollowing({ headerHeight }: { headerHeight: number }) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    k.my.following.useSuspenseInfiniteQuery()

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
    queryClient.prefetchInfiniteQuery({
      ...k.my.following.getFetchOptions(),
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

function MemberTopics({
  username,
  headerHeight,
}: {
  username: string
  headerHeight: number
}) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    k.member.topics.useSuspenseInfiniteQuery({
      variables: { username },
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
    queryClient.prefetchInfiniteQuery({
      ...k.member.topics.getFetchOptions({ username }),
      pages: 1,
    })
  )

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} hideAvatar />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
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
    </RefetchingIndicator>
  )
}
