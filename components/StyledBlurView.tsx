import { BlurView, BlurViewProps } from '@react-native-community/blur'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

export default function StyledBlurView(props: BlurViewProps) {
  return (
    <BlurView
      {...props}
      blurType={store.get(colorSchemeAtom)}
      blurAmount={12}
      style={tw.style(
        `bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(26,26,26,0.65)]`,
        props.style as any
      )}
      reducedTransparencyFallbackColor={tw`bg-body-1`.backgroundColor as string}
    />
  )
}
