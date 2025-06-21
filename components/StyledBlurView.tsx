import { BlurView as RNBlurView } from '@react-native-community/blur'
import { useAtomValue } from 'jotai'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import {
  defaultColors,
  formatColor,
  themeColorsMap,
  uiAtom,
} from '@/jotai/uiAtom'
import tw from '@/utils/tw'

export const supportsBlurviewColors = [
  defaultColors.base100.dark,
  defaultColors.base100.light,
  themeColorsMap.business.base100,
  themeColorsMap.business.base100,
  themeColorsMap.forest.base100,
  themeColorsMap.black.base100,
  themeColorsMap.synthwave.base100,
  themeColorsMap.night.base100,
  themeColorsMap.coffee.base100,
  themeColorsMap.sunset.base100,
  themeColorsMap.lemonade.base100,
  themeColorsMap.autumn.base100,
  themeColorsMap.acid.base100,
  themeColorsMap.cupcake.base100,
]
export type StyledBlurViewProps = {
  intensity?: number
  tint?: 'light' | 'dark' | 'default'
  style?: ViewStyle
  children?: React.ReactNode
}

const StyledBlurView = ({ intensity = 50, tint = 'default', style, children }: StyledBlurViewProps) => {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const blurType = colorScheme === 'dark' ? 'dark' : 'light'

  return (
    <RNBlurView
      style={[styles.container, style]}
      blurType={blurType}
      blurAmount={intensity}
      reducedTransparencyFallbackColor={colorScheme === 'dark' ? '#000000' : '#ffffff'}
    >
      {children}
    </RNBlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})

export default StyledBlurView
