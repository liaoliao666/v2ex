import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import tw from '@/utils/tw'

const dot = <React.Fragment />

const dotSize = 10

export type BadgeProps = {
  content?: React.ReactNode | typeof dot
  color?: string
  bordered?: boolean
  children?: React.ReactNode
  wrapperStyle?: ViewStyle
  right?: number
  top?: number
}

export default function Badge(props: BadgeProps) {
  const {
    content,
    color = '#ff411c',
    children,
    top = -dotSize / 2,
    right = -dotSize / 2,
    wrapperStyle,
  } = props

  const isDot = content === dot

  const element = content ? (
    <View
      style={tw.style(
        !!children &&
          ({
            position: 'absolute',
            right,
            top,
          } as ViewStyle),
        isDot && tw`min-w-[${dotSize}px] w-[${dotSize}px] h-[${dotSize}px]`,
        props.bordered && tw`border border-tint-border border-solid`,
        { backgroundColor: color, borderRadius: 9999 }
      )}
    >
      {!isDot && (
        <Text
          style={tw`min-w-[8px] py-px px-1 text-[9px] leading-3 text-white`}
        >
          {content}
        </Text>
      )}
    </View>
  ) : null

  return children ? (
    <View style={wrapperStyle}>
      {children}
      {element}
    </View>
  ) : (
    element
  )
}

Badge.dot = dot
