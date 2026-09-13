import { measureHeights } from 'expo-pretext'
import { useAtomValue } from 'jotai'
import { findIndex, last, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  LayoutChangeEvent,
  ListRenderItem,
  Platform,
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
import BlockedTopicsNotice from '@/components/topic/BlockedTopicsNotice'
import TopicItem from '@/components/topic/TopicItem'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { Topic, k } from '@/servicies'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import usePreviousDistinct from '@/utils/usePreviousDistinct'
import { useRefreshByUser } from '@/utils/useRefreshByUser'
import { useScreenWidth } from '@/utils/useScreenWidth'
import { useTopicBlockRules } from '@/utils/useTopicBlockRules'

const TAB_BAR_HEIGHT = 40
const TOPIC_ITEM_FIXED_HEIGHT = 32

function getTextMetrics(style: string) {
  const textStyle = tw.style(style) as {
    fontSize?: number
    lineHeight?: number
  }
  return {
    fontSize: textStyle.fontSize || 14,
    lineHeight: textStyle.lineHeight || textStyle.fontSize || 14,
  }
}

function useTopicListLayout(
  items: Topic[],
  headerHeight: number,
  hideAvatar: boolean
) {
  const { fontSize } = useAtomValue(uiAtom)
  const screenWidth = useScreenWidth()
  const heights = useRef(new Map<number, number>()).current
  const headerLength = useRef(0)
  const mediumMetrics = getTextMetrics(fontSize.medium)
  const smallMetrics = getTextMetrics(fontSize.small)
  const predictedHeights = useMemo(() => {
    const titleHeights = measureHeights(
      items.map(item => item.title),
      {
        fontFamily: 'System',
        fontSize: mediumMetrics.fontSize,
        lineHeight: mediumMetrics.lineHeight,
        fontWeight: '500',
      },
      Math.max(1, screenWidth - (hideAvatar ? 32 : 64))
    )
    return new Map(
      items.map((item, index) => [
        item.id,
        TOPIC_ITEM_FIXED_HEIGHT +
          mediumMetrics.lineHeight +
          Math.min(titleHeights[index] || 0, mediumMetrics.lineHeight * 2) +
          smallMetrics.lineHeight,
      ])
    )
  }, [
    hideAvatar,
    items,
    mediumMetrics.fontSize,
    mediumMetrics.lineHeight,
    screenWidth,
    smallMetrics.lineHeight,
  ])
  const onItemLayout = useCallback(
    (id: number, event: LayoutChangeEvent) => {
      heights.set(id, event.nativeEvent.layout.height)
    },
    [heights]
  )
  const onHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    headerLength.current = event.nativeEvent.layout.height
  }, [])
  const getItemLayout = useCallback(
    (data: ArrayLike<Topic> | null | undefined, index: number) => {
      const getLength = (itemIndex: number) => {
        const item = data?.[itemIndex]
        return item
          ? heights.get(item.id) ?? predictedHeights.get(item.id) ?? 120
          : 120
      }
      let offset = headerHeight + headerLength.current
      for (let itemIndex = 0; itemIndex < index; itemIndex++) {
        offset += getLength(itemIndex) + 1
      }
      return { length: getLength(index), offset, index }
    },
    [headerHeight, heights, predictedHeights]
  )
  return { getItemLayout, onHeaderLayout, onItemLayout }
}

export default withQuerySuspense(MyFollowingScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoMyFollowing = withQuerySuspense(memo(MyFollowing), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight()
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})
const MemoMemberTopics = withQuerySuspense(memo(MemberTopics), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight()
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
  LoadingComponent: () => {
    const headerHeight = useNavBarHeight()
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
  const previousIndex = usePreviousDistinct(index)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const layout = useWindowDimensions()

  const headerHeight = useNavBarHeight()
  const swipeEdgeWidth = Platform.OS === 'ios' ? 52 : 32

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) => {
          const routeIndex = routes.indexOf(route)
          if (
            routeIndex !== previousIndex &&
            Math.abs(index - routeIndex) > 1
          ) {
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

            <NavBar style={tw`border-b-0`}>
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
            </NavBar>
          </View>
        )}
      />

      <View
        collapsable={false}
        style={tw`absolute left-0 bottom-0 top-[${headerHeight}px] w-[${swipeEdgeWidth}px]`}
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

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )
  const { visibleTopics, blockedTopics } = useTopicBlockRules(flatedData)
  const { getItemLayout, onHeaderLayout, onItemLayout } = useTopicListLayout(
    visibleTopics,
    headerHeight,
    false
  )
  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => (
      <View onLayout={event => onItemLayout(item.id, event)}>
        <TopicItem key={item.id} topic={item} />
      </View>
    ),
    [onItemLayout]
  )

  return (
    <RefetchingIndicator
      isRefetching={isFetching && !isRefetchingByUser && !isFetchingNextPage}
      progressViewOffset={headerHeight}
    >
      <FlatList
        data={visibleTopics}
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
        ListHeaderComponent={
          <View onLayout={onHeaderLayout}>
            <BlockedTopicsNotice
              blockedTopics={blockedTopics}
              sourceTitle="特别关注"
            />
          </View>
        }
        renderItem={renderItem}
        getItemLayout={getItemLayout}
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

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
  )
  const { visibleTopics, blockedTopics } = useTopicBlockRules(flatedData)
  const { getItemLayout, onHeaderLayout, onItemLayout } = useTopicListLayout(
    visibleTopics,
    headerHeight,
    true
  )
  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => (
      <View onLayout={event => onItemLayout(item.id, event)}>
        <TopicItem key={item.id} topic={item} hideAvatar />
      </View>
    ),
    [onItemLayout]
  )

  return (
    <RefetchingIndicator
      isRefetching={isFetching && !isRefetchingByUser && !isFetchingNextPage}
      progressViewOffset={headerHeight}
    >
      <FlatList
        data={visibleTopics}
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
        ListHeaderComponent={
          <View onLayout={onHeaderLayout}>
            <BlockedTopicsNotice
              blockedTopics={blockedTopics}
              sourceTitle={username}
            />
          </View>
        }
        renderItem={renderItem}
        getItemLayout={getItemLayout}
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
