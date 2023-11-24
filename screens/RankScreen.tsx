import { useAtomValue } from 'jotai'
import { findIndex } from 'lodash-es'
import { useSuspenseQuery } from 'quaere'
import { memo, useCallback, useState } from 'react'
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

import DebouncedPressable from '@/components/DebouncedPressable'
import LoadingIndicator from '@/components/LoadingIndicator'
import Money from '@/components/Money'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { topPlayerQuery, topRichQuery } from '@/servicies/top'
import { Member } from '@/servicies/types'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TAB_BAR_HEIGHT = 40

export default withQuerySuspense(RankScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="社区排行" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="社区排行" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoTopRichList = withQuerySuspense(memo(TopRichList), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})
const MemoTopPlayerList = withQuerySuspense(memo(TopPlayerList), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})

type RankTab = 'topRich' | 'topPlayer'

const routes: {
  title: string
  key: RankTab
}[] = [
  {
    title: '财富排行',
    key: 'topRich',
  },
  {
    title: '消费排行',
    key: 'topPlayer',
  },
]

function RankScreen() {
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
          route.key === 'topRich' ? (
            <MemoTopRichList headerHeight={headerHeight} />
          ) : (
            <MemoTopPlayerList headerHeight={headerHeight} />
          )
        }
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <NavBar title="社区排行" style={tw`border-b-0`} />

            <TabBar
              {...props}
              scrollEnabled
              style={tw`flex-row shadow-none border-b border-divider border-solid bg-transparent`}
              tabStyle={tw`w-[80px] h-[${TAB_BAR_HEIGHT}px]`}
              indicatorStyle={tw`w-[40px] ml-[20px] bg-foreground h-1 rounded-full`}
              indicatorContainerStyle={tw`border-b-0`}
              renderTabBarItem={({ route }) => {
                const active = routes[index].key === route.key

                return (
                  <TouchableOpacity
                    key={route.key}
                    style={tw`w-[80px] flex-row items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                    activeOpacity={active ? 1 : 0.5}
                    onPress={() => {
                      setIndex(findIndex(routes, { key: route.key }))
                    }}
                  >
                    <Text
                      style={tw.style(
                        `ml-2 ${getFontSize(5)} flex-shrink`,
                        active
                          ? tw`text-foreground font-medium`
                          : tw`text-default`
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

function TopRichList({ headerHeight }: { headerHeight: number }) {
  const { data, refetch } = useSuspenseQuery({ query: topRichQuery })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Member> = useCallback(
    ({ item }) => (
      <RankItem key={item.username} member={item} rankTab="topRich" />
    ),
    []
  )

  return (
    <FlatList
      data={data}
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
      onEndReachedThreshold={0.3}
      ListFooterComponent={<SafeAreaView edges={['bottom']} />}
    />
  )
}

function TopPlayerList({ headerHeight }: { headerHeight: number }) {
  const { data, refetch } = useSuspenseQuery({
    query: topPlayerQuery,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Member> = useCallback(
    ({ item }) => (
      <RankItem key={item.username} member={item} rankTab="topPlayer" />
    ),
    []
  )

  return (
    <FlatList
      data={data}
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
      onEndReachedThreshold={0.3}
      ListFooterComponent={<SafeAreaView edges={['bottom']} />}
    />
  )
}

const RankItem = memo(
  ({ member, rankTab }: { member: Member; rankTab: RankTab }) => {
    return (
      <View style={tw`px-4 py-3 flex-row bg-background`}>
        <View style={tw`mr-3`}>
          <DebouncedPressable
            onPress={() => {
              navigation.push('MemberDetail', {
                username: member?.username!,
              })
            }}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={{
                uri: member?.avatar,
              }}
            />
          </DebouncedPressable>
        </View>

        <View style={tw`flex-1 gap-1`}>
          <View style={tw`flex-row gap-2`}>
            <Text
              style={tw`text-foreground ${getFontSize(5)} font-semibold`}
              numberOfLines={1}
              onPress={() => {
                navigation.push('MemberDetail', {
                  username: member?.username!,
                })
              }}
            >
              {member?.username}
            </Text>

            {rankTab === 'topPlayer' ? (
              <Text style={tw`${getFontSize(6)} text-default`}>
                {member.cost}
              </Text>
            ) : (
              <Money {...member} />
            )}
          </View>

          {member.motto && (
            <Text
              style={tw.style(`${getFontSize(6)} text-foreground`)}
              selectable
            >
              {member.motto}
            </Text>
          )}

          {member.website && (
            <Text
              onPress={() => {
                navigation.navigate('Webview', { url: member.website! })
              }}
              style={tw.style(`${getFontSize(6)} text-primary`)}
              numberOfLines={1}
            >
              {member.website.replace(/^https?:\/\//, '')}
            </Text>
          )}

          <Text style={tw.style(`${getFontSize(6)} text-default`)}>
            第 {member.id} 号会员
          </Text>
        </View>
      </View>
    )
  }
)
