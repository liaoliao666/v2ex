import { useAtomValue } from 'jotai'
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native'

import { colorsAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const StyledActivityIndicator = (props: ActivityIndicatorProps) => {
  const colors = useAtomValue(colorsAtom)
  const color = tw.color(
    `android:text-[${colors.default.light}] dark:text-[${colors.foreground.dark}]`
  )!

  return <ActivityIndicator color={color} {...props} />
}

export default StyledActivityIndicator
