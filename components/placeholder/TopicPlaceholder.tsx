import { View, ViewStyle } from 'react-native'
import {
  Fade,
  Placeholder,
  PlaceholderLine,
  PlaceholderMedia,
} from 'rn-placeholder'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

function AvatarPlaceholder() {
  return (
    <PlaceholderMedia
      style={tw`w-6 h-6 rounded-full mr-3`}
      color={tw.color('bg-loading')}
    />
  )
}

export function TopicItemPlaceholder({ hideAvatar }: { hideAvatar?: boolean }) {
  return (
    <Placeholder
      style={tw`px-4 py-3 flex-row bg-body-1 border-b border-solid border-tint-border`}
      Left={hideAvatar ? undefined : AvatarPlaceholder}
    >
      <View style={tw`gap-2`}>
        <PlaceholderLine
          width={40}
          noMargin
          style={tw`mt-1`}
          color={tw.color('bg-loading')}
        />
        <PlaceholderLine noMargin color={tw.color('bg-loading')} />
        <PlaceholderLine width={80} noMargin color={tw.color('bg-loading')} />
      </View>
    </Placeholder>
  )
}

export default function TopicPlaceholder({
  style,
  hideAvatar,
  hideAnimation,
}: {
  style?: ViewStyle
  hideAvatar?: boolean
  hideAnimation?: boolean
}) {
  return (
    <Placeholder
      Animation={
        store.get(colorSchemeAtom) === 'dark' || hideAnimation
          ? undefined
          : Fade
      }
      style={style}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <TopicItemPlaceholder key={i} hideAvatar={hideAvatar} />
      ))}
    </Placeholder>
  )
}
