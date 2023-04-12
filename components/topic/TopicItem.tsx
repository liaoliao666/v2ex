import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { compact, isEqual } from 'lodash-es'
import { memo } from 'react'
import { Text, View } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

import DebouncedPressable from '../DebouncedPressable'
import Separator from '../Separator'
import StyledButton from '../StyledButton'
import StyledImage from '../StyledImage'

export interface TopicItemProps {
  topic: Topic
  hideAvatar?: boolean
}

export default memo(TopicItem, isEqual)

function TopicItem({ topic, hideAvatar }: TopicItemProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const { isFetched } = useTopicDetail({
    variables: { id: topic.id },
    enabled: false,
  })

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-body-1`}
      onPress={() => {
        navigation.push('TopicDetail', topic)
      }}
    >
      {!hideAvatar && (
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
              source={{
                uri: topic.member?.avatar,
              }}
            />
          </DebouncedPressable>
        </View>
      )}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-tint-primary ${getFontSize(5)} flex-shrink`}
            numberOfLines={1}
            onPress={() => {
              navigation.push('MemberDetail', {
                username: topic.member?.username!,
              })
            }}
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
        </View>

        <Text
          style={tw.style(
            `${getFontSize(5)} pt-1 font-medium`,
            isFetched ? `text-tint-secondary` : `text-tint-primary`
          )}
        >
          {topic.title}
        </Text>

        <Separator style={tw`mt-1`}>
          {compact([
            !!topic.votes && (
              <Text
                key="votes"
                style={tw`text-tint-secondary ${getFontSize(6)}`}
              >
                {`${topic.votes} 赞同`}
              </Text>
            ),
            !!topic.reply_count && (
              <Text
                key="replies"
                style={tw`text-tint-secondary ${getFontSize(6)}`}
              >
                {`${topic.reply_count} 回复`}
              </Text>
            ),
            <Text
              key="last_touched"
              style={tw`text-tint-secondary ${getFontSize(6)}`}
            >
              {topic.last_touched}
            </Text>,
            !!topic.last_reply_by && (
              <Text
                key="last_reply_by"
                style={tw`text-tint-primary ${getFontSize(6)} flex-1`}
                numberOfLines={1}
              >
                <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
                  最后回复于
                </Text>
                {topic.last_reply_by}
              </Text>
            ),
          ])}
        </Separator>
      </View>
    </DebouncedPressable>
  )
}
