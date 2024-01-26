import { useAtomValue } from 'jotai'
import { View, ViewStyle } from 'react-native'
import { Placeholder, PlaceholderLine, PlaceholderMedia } from 'rn-placeholder'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import StyledFade from './StyledFade'

function AvatarPlaceholder() {
  const { colors } = useAtomValue(uiAtom)
  return (
    <PlaceholderMedia
      style={tw`w-6 h-6 rounded-full mr-3`}
      color={colors.base300}
    />
  )
}

export function TopicItemPlaceholder({ hideAvatar }: { hideAvatar?: boolean }) {
  const { colors } = useAtomValue(uiAtom)
  return (
    <Placeholder
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}] border-b border-solid border-[${colors.divider}]`}
      Left={hideAvatar ? undefined : AvatarPlaceholder}
    >
      <View style={tw`gap-2`}>
        <PlaceholderLine
          width={40}
          noMargin
          style={tw`mt-1`}
          color={colors.base300}
        />
        <PlaceholderLine noMargin color={colors.base300} />
        <PlaceholderLine width={80} noMargin color={colors.base300} />
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
      Animation={hideAnimation ? undefined : StyledFade}
      style={style}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <TopicItemPlaceholder key={i} hideAvatar={hideAvatar} />
      ))}
    </Placeholder>
  )
}
