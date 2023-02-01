import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtomValue } from 'jotai'
import { findIndex } from 'lodash-es'
import { memo, useCallback, useState } from 'react'
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

import DebouncePressable from '@/components/DebouncePressable'
import LoadingIndicator from '@/components/LoadingIndicator'
import Money from '@/components/Money'
import NavBar, { NAV_BAR_HEIGHT, useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import Space from '@/components/Space'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopPlayer, useTopRich } from '@/servicies/top'
import { Member } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(RankScreen, {
  Loading: () => (
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
    const headerHeight = useNavBarHeight() + NAV_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})
const MemoTopPlayerList = withQuerySuspense(memo(TopPlayerList), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + NAV_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})

type RankTab = 'useTopRich' | 'useTopPlayer'

const routes: {
  title: string
  key: RankTab
}[] = [
  {
    title: '财富排行',
    key: 'useTopRich',
  },
  {
    title: '消费排行',
    key: 'useTopPlayer',
  },
]

function RankScreen() {
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
          route.key === 'useTopRich' ? (
            <MemoTopRichList headerHeight={headerHeight} />
          ) : (
            <MemoTopPlayerList headerHeight={headerHeight} />
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

            <NavBar title="社区排行" />

            <TabBar
              {...props}
              scrollEnabled
              style={tw`flex-row shadow-none border-b border-tint-border border-solid bg-transparent`}
              tabStyle={tw`w-[80px] h-[${NAV_BAR_HEIGHT}px]`}
              indicatorStyle={tw`w-[40px] ml-[20px] bg-primary h-1 rounded-full`}
              indicatorContainerStyle={tw`border-b-0`}
              renderTabBarItem={({ route }) => {
                const active = routes[index].key === route.key

                return (
                  <Pressable
                    key={route.key}
                    style={({ pressed }) =>
                      tw.style(
                        `w-[80px] flex-row items-center justify-center h-[${NAV_BAR_HEIGHT}px]`,
                        pressed && tw`bg-tab-press`
                      )
                    }
                    onPress={() => {
                      setIndex(findIndex(routes, { key: route.key }))
                    }}
                  >
                    <Text
                      style={tw.style(
                        `ml-2 ${getFontSize(5)} flex-shrink`,
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

function TopRichList({ headerHeight }: { headerHeight: number }) {
  const { data, refetch } = useTopRich({
    suspense: true,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Member> = useCallback(
    ({ item }) => (
      <RankItem key={item.username} member={item} rankTab="useTopRich" />
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
  const { data, refetch } = useTopPlayer({
    suspense: true,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Member> = useCallback(
    ({ item }) => (
      <RankItem key={item.username} member={item} rankTab="useTopPlayer" />
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
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    return (
      <DebouncePressable
        style={tw`px-4 py-3 flex-row bg-body-1`}
        onPress={() => {
          navigation.push('MemberDetail', {
            username: member.username,
          })
        }}
      >
        <View style={tw`mr-3`}>
          <DebouncePressable
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
          </DebouncePressable>
        </View>

        <Space direction="vertical" gap={4} style={tw`flex-1`}>
          <Space>
            <Text
              style={tw`text-tint-primary ${getFontSize(5)} font-bold`}
              numberOfLines={1}
            >
              {member?.username}
            </Text>
            {rankTab === 'useTopPlayer' ? (
              <Text style={tw`${getFontSize(6)} text-tint-secondary`}>
                {member.cost}
              </Text>
            ) : (
              <Money {...member} />
            )}
          </Space>

          {member.motto && (
            <Text style={tw.style(`${getFontSize(6)} text-tint-secondary`)}>
              {member.motto}
            </Text>
          )}

          {member.website && (
            <Text
              onPress={() => {
                openURL(member.website!)
              }}
              style={tw.style(`${getFontSize(6)} text-tint-primary`)}
              numberOfLines={1}
            >
              {member.website.replace(/^https?:\/\//, '')}
            </Text>
          )}

          <Text style={tw.style(`${getFontSize(6)} text-tint-secondary`)}>
            第 {member.id} 号会员
          </Text>
        </Space>
      </DebouncePressable>
    )
  }
)
