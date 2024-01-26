import { useAtomValue } from 'jotai'
import { Children, Fragment } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

export type SeparatorProps = {
  children?: React.ReactNode
  style?: ViewStyle
}

export function DotSeparator() {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <Text
      style={tw`w-4 text-[${colors.default}] text-center ${fontSize.medium}`}
    >
      ·
    </Text>
  )
}

export function LineSeparator() {
  const { colors } = useAtomValue(uiAtom)
  return <View style={tw`border-t border-solid border-[${colors.divider}]`} />
}

export default function Separator({ children, style }: SeparatorProps) {
  return (
    <View style={tw.style('flex-row items-center flex-wrap', style)}>
      {Children.map(children, (child, i) => {
        const isLast = i === Children.count(children) - 1

        return (
          child != null && (
            <Fragment>
              {child}
              {!isLast && <DotSeparator />}
            </Fragment>
          )
        )
      })}
    </View>
  )
}
