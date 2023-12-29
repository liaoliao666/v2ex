import { ReactNode } from 'react'
import { Text, View } from 'react-native'
import {
  Fade,
  Placeholder,
  PlaceholderLine,
  PlaceholderMedia,
} from 'rn-placeholder'

import StyledImage from '@/components/StyledImage'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { Topic } from '@/servicies'
import tw from '@/utils/tw'

import NavBar from '../NavBar'

function AvatarPlaceholder() {
  return (
    <PlaceholderMedia
      style={tw`w-12 h-12 rounded-full mr-3`}
      color={tw.color('bg-loading')}
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
  return (
    <View style={tw`flex-1 bg-background`}>
      <NavBar />
      {!!topic.member && (
        <View>
          <View style={tw`flex-row items-center pt-3 px-4`}>
            <View style={tw`mr-3`}>
              <StyledImage
                style={tw.style(
                  `w-12 h-12 rounded-full`,
                  !topic.member.avatar && `bg-loading`
                )}
                source={topic.member?.avatar}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-foreground ${getFontSize(4)} font-semibold`}>
                {topic.member?.username}
              </Text>

              <Text
                key="reply_count"
                style={tw`text-default ${getFontSize(5)} flex-1 min-h-[24px]`}
                numberOfLines={1}
              >
                {`${topic.reply_count} 回复`}
              </Text>
            </View>
          </View>
          <Text
            style={tw`text-foreground border-b border-divider border-solid ${getFontSize(
              3
            )} font-medium pt-2 px-4`}
          >
            {topic.title}
          </Text>
        </View>
      )}

      {isError ? (
        children
      ) : (
        <Placeholder
          Animation={store.get(colorSchemeAtom) === 'light' ? Fade : undefined}
        >
          {!topic?.member && (
            <Placeholder style={tw`pt-3 px-4`} Left={AvatarPlaceholder}>
              <PlaceholderLine
                style={tw`mt-2`}
                width={30}
                color={tw.color('bg-loading')}
              />
              <PlaceholderLine width={40} color={tw.color('bg-loading')} />
            </Placeholder>
          )}

          <Placeholder
            style={tw`pt-2 px-4 border-b border-divider border-solid`}
          >
            <PlaceholderLine color={tw.color('bg-loading')} />
            <PlaceholderLine color={tw.color('bg-loading')} />
            <PlaceholderLine color={tw.color('bg-loading')} />
            <PlaceholderLine width={30} color={tw.color('bg-loading')} />
          </Placeholder>

          {children}
        </Placeholder>
      )}
    </View>
  )
}
