import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import { compact } from 'lodash-es'
import { memo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useTopicDetail } from '@/servicies/topic'
import { Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

import DebouncePressable from '../DebouncePressable'
import Separator from '../Separator'
import Space from '../Space'
import StyledButton from '../StyledButton'
import StyledImage from '../StyledImage'

export interface TopicItemProps {
  topic: Topic
  hideAvatar?: boolean
  isDisabledPress?: () => boolean
}

export default memo(TopicItem)

function TopicItem({ topic, hideAvatar, isDisabledPress }: TopicItemProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const { isFetched } = useTopicDetail({
    variables: { id: topic.id },
    enabled: false,
  })

  return (
    <DebouncePressable
      style={tw`px-4 py-3 flex-row bg-body-1`}
      onPress={() => {
        if (isDisabledPress?.()) return
        navigation.push('TopicDetail', { id: topic.id })
      }}
    >
      {!hideAvatar && (
        <View style={tw`mr-3`}>
          <Pressable
            onPress={() => {
              if (isDisabledPress?.()) return
              navigation.push('MemberDetail', {
                username: topic.member?.username!,
              })
            }}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={{
                uri: topic.member?.avatar,
              }}
            />
          </Pressable>
        </View>
      )}
      <View style={tw`flex-1`}>
        <Space style={tw`items-center`}>
          <Text
            style={tw`text-tint-primary text-body-5 flex-1`}
            numberOfLines={1}
          >
            {topic.member?.username}
          </Text>

          {!!topic.node?.title && (
            <StyledButton
              size="mini"
              type="tag"
              onPress={() => {
                navigation.push('NodeTopics', { name: topic.node?.name! })
              }}
            >
              {topic.node?.title}
            </StyledButton>
          )}
        </Space>

        <Text
          style={tw.style(
            `text-body-5 pt-1 font-medium`,
            isFetched ? `text-tint-secondary` : `text-tint-primary`
          )}
        >
          {topic.title}
        </Text>

        <Separator style={tw`mt-1`}>
          {compact([
            !!topic.votes && (
              <Text key="votes" style={tw`text-tint-secondary text-body-6`}>
                {`${topic.votes} 赞同`}
              </Text>
            ),
            !!topic.reply_count && (
              <Text key="replies" style={tw`text-tint-secondary text-body-6`}>
                {`${topic.reply_count} 回复`}
              </Text>
            ),
            <Text
              key="last_touched"
              style={tw`text-tint-secondary text-body-6`}
            >
              {dayjs(topic.last_touched).fromNow()}
            </Text>,
            !!topic.last_reply_by && (
              <Text
                key="last_reply_by"
                style={tw`text-tint-primary text-body-6 flex-1`}
                numberOfLines={1}
              >
                <Text style={tw`text-tint-secondary text-body-6`}>
                  最后回复于
                </Text>
                {topic.last_reply_by}
              </Text>
            ),
          ])}
        </Separator>
      </View>
    </DebouncePressable>
  )
}
