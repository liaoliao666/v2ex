import { Children, Fragment } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import tw from '@/utils/tw'

export type SeparatorProps = {
  children?: React.ReactNode
  style?: ViewStyle
}

export function DotSeparator() {
  return (
    <Text style={tw`w-4 text-tint-secondary text-center text-body-5`}>·</Text>
  )
}

export function LineSeparator() {
  return <View style={tw`border-t border-solid border-tint-border`} />
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
