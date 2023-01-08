import { BlurView, BlurViewProps } from 'expo-blur'
import { useAtomValue } from 'jotai'
import { Platform, View } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

const CompatibleBLurView = Platform.OS === 'android' ? View : BlurView

export default function StyledBlurView(props: BlurViewProps) {
  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <CompatibleBLurView
      {...props}
      tint={colorScheme}
      style={tw.style(
        Platform.OS === 'android'
          ? tw`bg-body-1`
          : `bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(26,26,26,0.65)]`,
        props.style as any
      )}
    />
  )
}
