import { useAtom } from 'jotai'
import { compact, isString, last, pick, uniqBy, upperCase } from 'lodash-es'
import { inferData } from 'quaere'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import IconButton from '@/components/IconButton'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import SearchBar from '@/components/SearchBar'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { RecentTopic, recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { navigation } from '@/navigation/navigationRef'
import { topicDetailQuery } from '@/servicies/topic'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'

export default function RecentTopicScreen() {
  const [recentTopics, setRecentTopics] = useAtom(recentTopicsAtom)

  const [searchText, setSearchText] = useState('')

  const allRecentTopics = useMemo(() => {
    const localRecentTopics = queryClient
      .getQueryCache()
      .findAll({
        query: topicDetailQuery,
      })
      .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
      .map(query => {
        const lastPage = last(query.state.data?.pages) as inferData<
          typeof topicDetailQuery
        >
        if (!lastPage?.title) return
        return {
          member: pick(lastPage.member, ['username', 'avatar']),
          ...pick(lastPage, ['id', 'title']),
        }
      })

    return uniqBy(
      compact([...recentTopics, ...localRecentTopics]),
      'id'
    ).filter(
      topic =>
        isString(topic.title) &&
        upperCase(topic.title).includes(upperCase(searchText))
    )
  }, [recentTopics, searchText]) as RecentTopic[]

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
        ListEmptyComponent={<Empty description="目前还没有最近浏览主题" />}
      />

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          right={
            <IconButton
              name="delete-empty-outline"
              color={tw.color(`text-foreground`)}
              activeColor={tw.color(`text-foreground`)}
              onPress={async () => {
                try {
                  await confirm(`确认清除最近浏览主题吗？`)
                  queryClient.removeQueries({
                    query: topicDetailQuery,
                  })
                  setRecentTopics([])
                  Toast.show({
                    type: 'success',
                    text1: `清除成功`,
                  })
                } catch (error) {
                  // empty
                }
              }}
            />
          }
        >
          <SearchBar
            style={tw`flex-1`}
            value={searchText}
            placeholder="搜索最近浏览主题"
            onChangeText={text => {
              setSearchText(text.trim())
            }}
          />
        </NavBar>
      </View>
    </View>
  )
}

const RecentTopicItem = memo(
  ({ recentTopic }: { recentTopic: RecentTopic }) => {
    return (
      <DebouncedPressable
        style={tw`px-4 py-3 flex-row bg-background`}
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
            style={tw`text-foreground ${getFontSize(5)} font-semibold`}
            numberOfLines={1}
            onPress={() => {
              navigation.push('MemberDetail', {
                username: recentTopic.member?.username!,
              })
            }}
          >
            {recentTopic.member?.username}
          </Text>

          <Text style={tw.style(`${getFontSize(5)} pt-1 text-foreground`)}>
            {recentTopic.title}
          </Text>
        </View>
      </DebouncedPressable>
    )
  }
)
