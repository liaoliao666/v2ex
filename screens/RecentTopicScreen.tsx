import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtomValue } from 'jotai'
import { compact, last, pick, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { inferData } from 'react-query-kit'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { RecentTopic, recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { useTopicDetail } from '@/servicies/topic'
import { RootStackParamList } from '@/types'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'

export default function RecentTopicScreen() {
  const recentTopics = useAtomValue(recentTopicsAtom)

  const allRecentTopics = useMemo(() => {
    const localRecentTopics = queryClient
      .getQueryCache()
      .findAll(useTopicDetail.getKey())
      .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
      .map(query => {
        const lastPage = last(
          (query.state.data as inferData<typeof useTopicDetail>)?.pages
        )
        if (!lastPage?.title) return
        return {
          member: pick(lastPage.member, ['username', 'avatar']),
          ...pick(lastPage, ['id', 'title']),
        }
      })

    return uniqBy(compact([...recentTopics, ...localRecentTopics]), 'id')
  }, [recentTopics]) as RecentTopic[]

  const renderItem: ListRenderItem<RecentTopic> = useCallback(
    ({ item }) => <RecentTopicItem recentTopic={item} />,
    []
  )

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      <FlatList
        data={allRecentTopics}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
        ItemSeparatorComponent={LineSeparator}
        renderItem={renderItem}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        ListEmptyComponent={<Empty description="目前还没有已读主题" />}
      />

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="最近浏览" />
      </View>
    </View>
  )
}

const RecentTopicItem = memo(
  ({ recentTopic }: { recentTopic: RecentTopic }) => {
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    return (
      <DebouncedPressable
        style={tw`px-4 py-3 flex-row bg-body-1`}
        onPress={() => {
          navigation.push('TopicDetail', recentTopic)
        }}
      >
        <View style={tw`mr-3`}>
          <DebouncedPressable
            onPress={() => {
              navigation.push('MemberDetail', {
                username: recentTopic.member?.username!,
              })
            }}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={{
                uri: recentTopic.member?.avatar,
              }}
            />
          </DebouncedPressable>
        </View>

        <View style={tw`flex-1`}>
          <Text
            style={tw`text-tint-primary ${getFontSize(5)} font-semibold`}
            numberOfLines={1}
          >
            {recentTopic.member?.username}
          </Text>

          <Text style={tw.style(`${getFontSize(5)} pt-1 text-tint-primary`)}>
            {recentTopic.title}
          </Text>
        </View>
      </DebouncedPressable>
    )
  }
)
