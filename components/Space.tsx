import { Children } from 'react'
import { View, ViewProps, ViewStyle } from 'react-native'

import tw from '@/utils/tw'

export type SpaceProps = {
  direction?: 'horizontal' | 'vertical'
  wrap?: boolean
  children?: React.ReactNode
  gap?: number
  style?: ViewStyle
} & Omit<ViewProps, 'style'>

export default function Space({
  direction = 'horizontal',
  gap = 8,
  wrap,
  style,
  children,
  ...restProps
}: SpaceProps) {
  return (
    <View
      style={tw.style(
        wrap && `flex-wrap mb-[-${gap}px]`,
        direction === 'horizontal' && `flex-row items-center`,
        style
      )}
      {...restProps}
    >
      {Children.map(children, (child, i) => {
        const isLast = i === Children.count(children) - 1

        return (
          child != null && (
            <View
              style={
                direction === 'vertical'
                  ? tw.style(!isLast && `mb-[${gap}px]`)
                  : tw.style(
                      !isLast && `mr-[${gap}px]`,
                      wrap && `pb-[${gap}px]`
                    )
              }
            >
              {child}
            </View>
          )
        )
      })}
    </View>
  )
}
