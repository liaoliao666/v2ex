import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtomValue } from 'jotai'
import { memo, useCallback } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import NavBar from '@/components/NavBar'
import { LineSeparator } from '@/components/Separator'
import StyledImage from '@/components/StyledImage'
import { RecentTopic, recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function RecentTopicScreen() {
  const recentTopics = useAtomValue(recentTopicsAtom)

  const renderItem: ListRenderItem<RecentTopic> = useCallback(
    ({ item }) => <RecentTopicItem recentTopic={item} />,
    []
  )

  return (
    <View style={tw`flex-1`}>
      <NavBar title="最近浏览" />

      <FlatList
        removeClippedSubviews
        data={recentTopics}
        ItemSeparatorComponent={LineSeparator}
        renderItem={renderItem}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-16`}>
            <Text style={tw`text-tint-secondary text-body-6`}>
              目前还没有已读主题
            </Text>
          </View>
        }
      />
    </View>
  )
}

const RecentTopicItem = memo(
  ({ recentTopic }: { recentTopic: RecentTopic }) => {
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    return (
      <Pressable
        style={({ pressed }) =>
          tw.style(
            `px-4 py-3 flex-row bg-body-1`,
            pressed && 'bg-message-press'
          )
        }
        onPress={() => {
          navigation.push('TopicDetail', { id: recentTopic.id })
        }}
      >
        <View style={tw`mr-3`}>
          <Pressable
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
          </Pressable>
        </View>

        <View style={tw`flex-1`}>
          <Text
            style={tw`text-tint-primary text-body-5 font-bold`}
            numberOfLines={1}
          >
            {recentTopic.member?.username}
          </Text>

          <Text style={tw.style(`text-body-5 pt-1 text-tint-primary`)}>
            {recentTopic.title}
          </Text>
        </View>
      </Pressable>
    )
  }
)
