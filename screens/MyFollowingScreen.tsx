import { useAtomValue } from 'jotai'
import { findIndex, last, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { NAV_BAR_HEIGHT, useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicItem from '@/components/topic/TopicItem'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useMemberTopics, useMyFollowing } from '@/servicies/member'
import { Topic } from '@/servicies/types'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(MyFollowingScreen, {
  Loading: () => (
    <View style={tw`flex-1`}>
      <NavBar title="特别关注" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="特别关注" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoMyFollowing = withQuerySuspense(memo(MyFollowing))
const MemoMemberTopics = withQuerySuspense(memo(MemberTopics))

function MyFollowingScreen() {
  const { data } = useMyFollowing({
    suspense: true,
  })

  const following = last(data?.pages)?.following

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

  const headerHeight = useNavBarHeight() + NAV_BAR_HEIGHT

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

            <NavBar title="特别关注" />

            <TabBar
              {...props}
              scrollEnabled
              style={tw`flex-row shadow-none border-b border-tint-border border-solid bg-transparent`}
              tabStyle={tw`w-[100px] h-[${NAV_BAR_HEIGHT}px]`}
              indicatorStyle={tw`w-[40px] ml-[30px] bg-primary h-1 rounded-full`}
              indicatorContainerStyle={tw`border-b-0`}
              renderTabBarItem={({ route }) => {
                const active = routes[index].key === route.key

                return (
                  <Pressable
                    key={route.key}
                    style={({ pressed }) =>
                      tw.style(
                        `w-[100px] flex-row items-center justify-center h-[${NAV_BAR_HEIGHT}px]`,
                        pressed && tw`bg-tab-press`
                      )
                    }
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
                        `ml-2 text-body-5 flex-shrink`,
                        active
                          ? tw`text-tint-primary font-bold`
                          : tw`text-tint-secondary font-medium`
                      )}
                      numberOfLines={1}
                    >
                      {route.title}
                    </Text>
                  </Pressable>
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
  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMyFollowing({
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
  )

  return (
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
  )
}

function MemberTopics({
  username,
  headerHeight,
}: {
  username: string
  headerHeight: number
}) {
  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMemberTopics({
      variables: { username },
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
        <View style={tw`items-center justify-center py-16`}>
          <Text style={tw`text-tint-secondary text-body-6`}>
            {last(data?.pages)?.hidden ? '主题列表被隐藏' : '目前还没有主题'}
          </Text>
        </View>
      }
    />
  )
}
