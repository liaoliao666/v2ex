import { useAtomValue } from 'jotai'
import { Text, View } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const badgeStyle = tw`items-center justify-center px-[3px] py-px rounded-sm`

export default function ProBadge({ joined = false }: { joined?: boolean }) {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors, fontSize } = useAtomValue(uiAtom)
  const badgeFontSize =
    (tw.style(fontSize.tiny) as { fontSize?: number }).fontSize ?? 9
  const badgeTextStyle = tw.style(fontSize.tiny, {
    fontSize: badgeFontSize,
    lineHeight: badgeFontSize,
    textAlign: 'center',
    includeFontPadding: false,
  })

  return (
    <View
      style={tw.style(
        badgeStyle,
        `border-[${colors.primary}] border`,
        colorScheme !== 'dark' && `bg-[#323a45]`,
        joined && `border-l-0 rounded-l-none`
      )}
    >
      <Text
        style={[
          badgeTextStyle,
          colorScheme === 'dark'
            ? tw`text-[rgba(255,255,255,0.8)]`
            : tw`text-white`,
        ]}
      >
        PRO
      </Text>
    </View>
  )
}
