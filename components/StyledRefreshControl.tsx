import { useAtomValue } from 'jotai'
import { RefreshControl, RefreshControlProps } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'

export default function StyledRefreshControl({
  tintColor,
  ...props
}: RefreshControlProps) {
  const ui = useAtomValue(uiAtom)
  const colorScheme = useAtomValue(colorSchemeAtom)
  const color = tintColor || (colorScheme === 'dark' ? '#ffffff' : '#000000')

  return (
    <RefreshControl
      progressBackgroundColor={ui.colors.base100}
      colors={[color]}
      tintColor={color}
      {...props}
    />
  )
}
