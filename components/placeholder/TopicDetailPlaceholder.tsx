import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder'

import StyledImage from '@/components/StyledImage'
import { uiAtom } from '@/jotai/uiAtom'
import { Topic } from '@/servicies'
import tw from '@/utils/tw'

import NavBar from '../NavBar'
import StyledButton from '../StyledButton'
import StyledFade from './StyledFade'

function AvatarPlaceholder() {
  const { colors } = useAtomValue(uiAtom)
  return (
    <PlaceholderMedia
      style={tw`w-12 h-12 rounded-full mr-3`}
      color={colors.base300}
    />
  )
}

export default function TopicDetailPlaceholder({
  children,
  isError,
  topic,
}: {
  children?: ReactNode
  isError?: boolean
  topic: Partial<Topic>
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <NavBar title="帖子" />
      {!!topic.member && (
        <View>
          <View style={tw`flex-row items-center pt-3 px-4`}>
            <View style={tw`mr-3`}>
              {topic.member.avatar ? (
                <StyledImage
                  style={tw.style(`w-12 h-12 rounded-full`)}
                  source={topic.member?.avatar}
                />
              ) : (
                <View
                  style={tw.style(
                    `w-12 h-12 rounded-full bg-[${colors.base300}]`
                  )}
                />
              )}
            </View>

            <View style={tw`flex-1`}>
              <View style={tw`flex flex-row gap-2`}>
                <Text
                  key={'username'}
                  style={tw`text-[${colors.foreground}] ${fontSize.xlarge} font-semibold flex-shrink`}
                  numberOfLines={1}
                >
                  {topic.member?.username}
                </Text>
                {!!topic.node?.title && (
                  <StyledButton size="mini" type="tag">
                    {topic.node?.title}
                  </StyledButton>
                )}
              </View>

              <Text
                key="reply_count"
                style={tw`text-[${colors.default}] ${fontSize.medium} flex-1 min-h-[24px]`}
                numberOfLines={1}
              >
                {`${topic.reply_count} 回复`}
              </Text>
            </View>
          </View>
          <Text
            style={tw`text-[${colors.foreground}] border-b border-[${colors.divider}] border-solid ${fontSize.xxlarge} font-medium pt-2 px-4`}
          >
            {topic.title}
          </Text>
        </View>
      )}

      {isError ? (
        children
      ) : (
        <Placeholder Animation={StyledFade}>
          {!topic?.member && (
            <Placeholder style={tw`pt-3 px-4`} Left={AvatarPlaceholder}>
              <PlaceholderLine
                style={tw`mt-2`}
                width={30}
                color={colors.base300}
              />
              <PlaceholderLine width={40} color={colors.base300} />
            </Placeholder>
          )}

          <Placeholder
            style={tw`pt-2 px-4 border-b border-[${colors.divider}] border-solid`}
          >
            <PlaceholderLine color={colors.base300} />
            <PlaceholderLine color={colors.base300} />
            <PlaceholderLine color={colors.base300} />
            <PlaceholderLine width={30} color={colors.base300} />
          </Placeholder>

          {children}
        </Placeholder>
      )}
    </View>
  )
}
