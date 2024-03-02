import { useAtomValue } from 'jotai'
import { compact, isEqual, maxBy } from 'lodash-es'
import { memo } from 'react'
import { Text, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import { isLargeTablet } from '@/utils/tablet'
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
  const { colors, fontSize } = useAtomValue(uiAtom)

  const { data: isReaded } = k.topic.detail.useInfiniteQuery({
    variables: { id: topic.id },
    select: data => {
      const replyCount = maxBy(data.pages, 'reply_count')?.reply_count || 0
      return replyCount >= topic.reply_count
    },
    enabled: false,
  })

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
      onPress={() => {
        if (isLargeTablet() && getCurrentRouteName() === 'TopicDetail') {
          navigation.replace('TopicDetail', topic)
        } else {
          navigation.push('TopicDetail', topic)
        }
      }}
    >
      {!hideAvatar && (
        <View>
          <DebouncedPressable
            onPress={() => {
              navigation.push('MemberDetail', {
                username: topic.member?.username!,
              })
            }}
            style={tw`pr-3`}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={topic.member?.avatar}
              priority="high"
            />
          </DebouncedPressable>
        </View>
      )}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.medium} flex-shrink`}
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
                if (isLargeTablet() && getCurrentRouteName() === 'NodeTopics') {
                  navigation.replace('NodeTopics', { name: topic.node?.name! })
                } else {
                  navigation.push('NodeTopics', { name: topic.node?.name! })
                }
              }}
            >
              {topic.node?.title}
            </StyledButton>
          )}

          {topic.pin_to_top && (
            <StyledButton size="mini" color={colors.danger} type="tag" ghost>
              置顶
            </StyledButton>
          )}
        </View>

        <Text
          style={tw.style(
            `${fontSize.medium} pt-1 font-medium`,
            isReaded
              ? `text-[${colors.default}]`
              : `text-[${colors.foreground}]`
          )}
        >
          {topic.title}
        </Text>

        <Separator style={tw`mt-1`}>
          {compact([
            !!topic.votes && (
              <Text
                key="votes"
                style={tw`text-[${colors.default}] ${fontSize.small}`}
              >
                {`${topic.votes} 赞同`}
              </Text>
            ),
            !!topic.reply_count && (
              <Text
                key="replies"
                style={tw`text-[${colors.default}] ${fontSize.small}`}
              >
                {`${topic.reply_count} 回复`}
              </Text>
            ),
            <Text
              key="last_touched"
              style={tw`text-[${colors.default}] ${fontSize.small}`}
            >
              {topic.last_touched}
            </Text>,
            !!topic.last_reply_by && (
              <Text
                key="last_reply_by"
                style={tw`text-[${colors.foreground}] ${fontSize.small} flex-1`}
                numberOfLines={1}
              >
                <Text style={tw`text-[${colors.default}] ${fontSize.small}`}>
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
