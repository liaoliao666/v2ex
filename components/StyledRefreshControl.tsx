import { useAtomValue } from 'jotai'
import { RefreshControl, RefreshControlProps } from 'react-native'

import { colorsAtom, uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

export default function StyledRefreshControl({
  tintColor,
  ...props
}: RefreshControlProps) {
  const ui = useAtomValue(uiAtom)
  const colors = useAtomValue(colorsAtom)
  const color =
    tintColor ||
    tw.color(
      `android:text-[${colors.default.light}] dark:text-[${colors.foreground.dark}]`
    )!

  return (
    <RefreshControl
      progressBackgroundColor={ui.colors.base100}
      colors={[color]}
      tintColor={color}
      {...props}
    />
  )
}
