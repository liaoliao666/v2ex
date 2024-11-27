import { useAtomValue } from 'jotai'
import { RefreshControl, RefreshControlProps } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'

export default function StyledRefreshControl({
  tintColor,
  ...props
}: RefreshControlProps) {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const color = tintColor || (colorScheme === 'dark' ? '#ffffff' : '#000000')
  return <RefreshControl colors={[color]} tintColor={color} {...props} />
}
