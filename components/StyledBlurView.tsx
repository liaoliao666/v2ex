import { transparentize } from 'color2k'
import { BlurView, BlurViewProps } from 'expo-blur'
import { useAtomValue } from 'jotai'
import { Platform, View } from 'react-native'

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
  themeColorsMap.garden.base100,
  themeColorsMap.cupcake.base100,
  themeColorsMap.nord.base100,
]

export default function StyledBlurView(props: BlurViewProps) {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors } = useAtomValue(uiAtom)

  if (
    Platform.OS === 'ios' &&
    supportsBlurviewColors.includes(colors.base100)
  ) {
    return (
      <BlurView
        {...props}
        tint={colorScheme === 'light' ? 'default' : 'dark'}
        style={tw.style(
          `bg-[${formatColor(transparentize(colors.base100, 0.35))}]`,
          props.style as any
        )}
      />
    )
  }

  return (
    <View
      {...props}
      style={tw.style(`bg-[${colors.base100}]`, props.style as any)}
    />
  )
}
