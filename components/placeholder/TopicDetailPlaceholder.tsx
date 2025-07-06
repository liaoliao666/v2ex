import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import { Text, View } from 'react-native'

import StyledImage from '@/components/StyledImage'
import { uiAtom } from '@/jotai/uiAtom'
import { Topic } from '@/servicies'
import tw from '@/utils/tw'

import { PlaceholderShape } from './PlaceholderShape'
import { Placeholder } from './Placeholder'
import { PlaceholderLine } from './PlaceholderLine'

import NavBar from '../NavBar'
import StyledButton from '../StyledButton'

function AvatarPlaceholder() {
  const { colors } = useAtomValue(uiAtom)
  return (
    <PlaceholderShape
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
  const fontXxLarge = tw.style(fontSize.xlarge) as {
    fontSize: number
    lineHeight: number
  }
  const fontXLarge = tw.style(fontSize.xlarge) as {
    fontSize: number
    lineHeight: number
  }
  const fontMedium = tw.style(fontSize.medium) as {
    fontSize: number
    lineHeight: number
  }
  const xxLargeLineStyle = tw`h-[${fontXxLarge.fontSize}px] my-[${Math.floor(
    (fontXxLarge.lineHeight - fontXxLarge.fontSize) / 2
  )}px]`
  const xLargeLineStyle = tw`h-[${fontXLarge.fontSize}px] my-[${Math.floor(
    (fontXLarge.lineHeight - fontXLarge.fontSize) / 2
  )}px]`
  const mediumLineStyle = tw`h-[${fontMedium.fontSize}px] my-[${Math.floor(
    (fontMedium.lineHeight - fontMedium.fontSize) / 2
  )}px]`

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

              <PlaceholderLine
                style={mediumLineStyle}
                width={50}
                color={colors.base300}
              />
            </View>
          </View>
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.xxlarge} font-medium pt-2 pb-3 px-4`}
          >
            {topic.title}
          </Text>
        </View>
      )}

      {isError ? (
        children
      ) : (
        <Placeholder>
          {!topic?.member && (
            <Placeholder style={tw`pt-3 px-4`} Left={AvatarPlaceholder}>
              <PlaceholderLine
                style={tw.style(`mt-2`, xLargeLineStyle)}
                width={30}
                color={colors.base300}
              />
              <PlaceholderLine
                width={40}
                color={colors.base300}
                style={mediumLineStyle}
              />
            </Placeholder>
          )}

          <Placeholder
            style={tw`pb-3 px-4 border-b border-[${colors.divider}] border-solid`}
          >
            {!topic.member && (
              <View style={tw`pt-2 pb-3`}>
                <PlaceholderLine
                  width={50}
                  color={colors.base300}
                  style={xxLargeLineStyle}
                />
              </View>
            )}
            <PlaceholderLine color={colors.base300} style={mediumLineStyle} />
            <PlaceholderLine color={colors.base300} style={mediumLineStyle} />
            <PlaceholderLine color={colors.base300} style={mediumLineStyle} />
            <PlaceholderLine
              width={30}
              color={colors.base300}
              style={mediumLineStyle}
            />
          </Placeholder>

          {children}
        </Placeholder>
      )}
    </View>
  )
}
