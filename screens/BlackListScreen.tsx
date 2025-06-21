import { useAtomValue } from 'jotai'
import { findIndex, isEmpty, uniqBy } from 'lodash-es'
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
import { Toast } from 'react-native-toast-message/lib/src/Toast'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import { blackListAtom } from '@/jotai/blackListAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Member, Topic, k } from '@/servicies'
import '@/servicies/types'
import tw from '@/utils/tw'

const TAB_BAR_HEIGHT = 40

export default withQuerySuspense(BlackListScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="屏蔽列表" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="屏蔽列表" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoBlockers = withQuerySuspense(memo(Blockers), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})
const MemoIgnoreTopics = withQuerySuspense(memo(IgnoreTopics), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
})

type BlackTab = 'blockers' | 'ignoreTopcis'

const routes: {
  title: string
  key: BlackTab
}[] = [
  {
    title: '屏蔽用户',
    key: 'blockers',
  },
  {
    title: '忽略主题',
    key: 'ignoreTopcis',
  },
]

function BlackListScreen() {
  const [index, setIndex] = useState(0)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const layout = useWindowDimensions()

  const headerHeight = useNavBarHeight() + TAB_BAR_HEIGHT

  const blackList = useAtomValue(blackListAtom)

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <TabView
        key={colorScheme}
        navigationState={{ index, routes }}
        lazy
        lazyPreloadDistance={1}
        renderScene={({ route }) =>
          route.key === 'blockers' ? (
            <MemoBlockers headerHeight={headerHeight} />
          ) : (
            <MemoIgnoreTopics headerHeight={headerHeight} />
          )
        }
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        tabBarPosition="bottom"
        renderTabBar={props => (
          <View style={tw`absolute top-0 inset-x-0 z-10`}>
            <StyledBlurView style={tw`absolute inset-0`} />

            <NavBar
              title="屏蔽列表"
              right={
                routes[index].key === 'blockers'
                  ? !isEmpty(blackList.blockers) && <ResetBlockersButton />
                  : !isEmpty(blackList.ignoredTopics) && (
                      <ResetIgnoredTopicsButton />
                    )
              }
              style={tw`border-b-0`}
            />

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
                gap={24}
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
                      <Text
                        style={tw.style(
                          `${fontSize.medium} flex-shrink`,
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
            </View>
          </View>
        )}
      />
    </View>
  )
}

const BlockerItem = memo(({ member }: { member: Member }) => {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
      onPress={() => {
        navigation.push('MemberDetail', {
          username: member.username,
        })
      }}
    >
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
            source={{ uri: member?.avatar }}
          />
        </DebouncedPressable>
      </View>

      <View style={tw`flex-1 gap-1`}>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.medium} font-semibold`}
            numberOfLines={1}
          >
            {member?.username}
          </Text>
        </View>

        <Text style={tw.style(`${fontSize.small} text-[${colors.default}]`)}>
          第 {member.id} 号会员
        </Text>
      </View>
    </DebouncedPressable>
  )
})

function Blockers({ headerHeight }: { headerHeight: number }) {
  const blackList = useAtomValue(blackListAtom)

  const { data } = k.member.blockers.useSuspenseInfiniteQuery({
    variables: { ids: blackList.blockers },
  })

  const renderItem: ListRenderItem<Member> = useCallback(
    ({ item }) => <BlockerItem key={item.username} member={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  return (
    <FlatList
      data={flatedData}
      contentContainerStyle={{
        paddingTop: headerHeight,
      }}
      ItemSeparatorComponent={LineSeparator}
      renderItem={renderItem}
      onEndReachedThreshold={0.3}
      ListFooterComponent={<SafeAreaView edges={['bottom']} />}
      ListEmptyComponent={<Empty description="暂无屏蔽用户" />}
    />
  )
}

function IgnoreTopics({ headerHeight }: { headerHeight: number }) {
  const blackList = useAtomValue(blackListAtom)

  const { data } = k.member.ignoredTopics.useSuspenseInfiniteQuery({
    variables: {
      ids: blackList.ignoredTopics,
    },
  })

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <IgnoreTopicItem key={item.id} topic={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  return (
    <FlatList
      data={flatedData}
      contentContainerStyle={{
        paddingTop: headerHeight,
      }}
      ItemSeparatorComponent={LineSeparator}
      renderItem={renderItem}
      onEndReachedThreshold={0.3}
      ListFooterComponent={<SafeAreaView edges={['bottom']} />}
      ListEmptyComponent={<Empty description="暂无忽略主题" />}
    />
  )
}

const IgnoreTopicItem = memo(({ topic }: { topic: Topic }) => {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
      onPress={() => {
        navigation.push('TopicDetail', topic)
      }}
    >
      <View style={tw`mr-3`}>
        <DebouncedPressable
          onPress={() => {
            navigation.push('MemberDetail', {
              username: topic.member?.username!,
            })
          }}
        >
          <StyledImage
            style={tw`w-6 h-6 rounded-full`}
            source={topic.member?.avatar}
          />
        </DebouncedPressable>
      </View>

      <View style={tw`flex-1`}>
        <Text
          style={tw`text-[${colors.foreground}] ${fontSize.medium} font-semibold`}
          numberOfLines={1}
          onPress={() => {
            navigation.push('MemberDetail', {
              username: topic.member?.username!,
            })
          }}
        >
          {topic.member?.username}
        </Text>

        <Text
          style={tw.style(
            `${fontSize.medium} pt-1 text-[${colors.foreground}]`
          )}
        >
          {topic.title}
        </Text>
      </View>
    </DebouncedPressable>
  )
})

function ResetBlockersButton() {
  const { isPending, mutateAsync } = k.settings.resetBlockers.useMutation()

  return (
    <StyledButton
      shape="rounded"
      onPress={async () => {
        if (isPending) return

        try {
          await mutateAsync()

          store.set(blackListAtom, prev => ({
            ...prev,
            blockers: [],
          }))

          Toast.show({
            type: 'success',
            text1: `清除成功`,
          })
        } catch (error) {
          Toast.show({
            type: 'success',
            text1: '清除失败',
          })
        }
      }}
    >
      {isPending ? '清除中...' : '清除屏蔽用户'}
    </StyledButton>
  )
}

function ResetIgnoredTopicsButton() {
  const { isPending, mutateAsync } = k.settings.resetIgnoredTopics.useMutation()

  return (
    <StyledButton
      shape="rounded"
      onPress={async () => {
        if (isPending) return

        try {
          await mutateAsync()

          store.set(blackListAtom, prev => ({
            ...prev,
            ignoredTopics: [],
          }))

          Toast.show({
            type: 'success',
            text1: `清除成功`,
          })
        } catch (error) {
          Toast.show({
            type: 'success',
            text1: '清除失败',
          })
        }
      }}
    >
      {isPending ? '清除中...' : '清除忽略主题'}
    </StyledButton>
  )
}
