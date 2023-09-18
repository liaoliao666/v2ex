import { useAtomValue } from 'jotai'
import { findIndex, last, uniqBy } from 'lodash-es'
import { useSuspenseQuery } from 'quaere'
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
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { memberTopicsQuery, myFollowingQuery } from '@/servicies/member'
import { Topic } from '@/servicies/types'
import { useRemoveUnnecessaryPages } from '@/utils/query'
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
  useRemoveUnnecessaryPages({
    query: myFollowingQuery,
  })

  const { data } = useSuspenseQuery({
    query: myFollowingQuery,
  })

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

  return (
    <View style={tw`flex-1`}>
      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) =>
          route.key === 'all' ? (
            <MemoMyFollowing headerHeight={headerHeight} />
          ) : (
            <MemoMemberTopics
              headerHeight={headerHeight}
              username={route.key}
            />
          )
        }
        onIndexChange={setIndex}
        initialLayout={{
          width: layout.width,
        }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <NavBar title="特别关注" style={tw`border-b-0`} />

            <TabBar
              {...props}
              scrollEnabled
              style={tw`flex-row shadow-none border-b border-tint-border border-solid bg-transparent`}
              tabStyle={tw`w-[100px] h-[${TAB_BAR_HEIGHT}px]`}
              indicatorStyle={tw`w-[40px] ml-[30px] bg-primary h-1 rounded-full`}
              indicatorContainerStyle={tw`border-b-0`}
              renderTabBarItem={({ route }) => {
                const active = routes[index].key === route.key

                return (
                  <TouchableOpacity
                    key={route.key}
                    style={tw`w-[100px] flex-row items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                    activeOpacity={active ? 1 : 0.5}
                    onPress={() => {
                      setIndex(findIndex(routes, { key: route.key }))
                    }}
                  >
                    {route.avatar && (
                      <StyledImage
                        style={tw`w-5 h-5 rounded-full`}
                        source={{ uri: route.avatar }}
                      />
                    )}
                    <Text
                      style={tw.style(
                        `ml-2 ${getFontSize(5)} flex-shrink`,
                        active
                          ? tw`text-tint-primary font-semibold`
                          : tw`text-tint-secondary font-medium`
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
        )}
      />
    </View>
  )
}

function MyFollowing({ headerHeight }: { headerHeight: number }) {
  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useSuspenseQuery({
    query: myFollowingQuery,
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
  useRemoveUnnecessaryPages({
    query: memberTopicsQuery,
    variables: { username },
  })

  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useSuspenseQuery({
    query: memberTopicsQuery,
    variables: { username },
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
