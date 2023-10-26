import { pick } from 'lodash-es'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { PressableProps, Text, TextProps, ViewStyle } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

import DebouncedPressable from './DebouncedPressable'

const colors = {
  default: {
    color: `#0f1419`,
    darkColor: `rgb(239,243,244)`,
    textColor: '#fff',
    darkTextColor: '#0f1419',
    activeColor: `rgb(63,67,71)`,
    activeDarkColor: `rgb(191,194,195)`,
  },
  primary: {
    color: `#4d5256`,
    darkColor: `#4d5256`,
    textColor: '#fff',
    darkTextColor: '#fff',
    activeColor: `#778087`,
    activeDarkColor: `#778087`,
  },
  secondary: {
    color: `rgb(29,155,240)`,
    darkColor: `rgb(239,243,244)`,
    textColor: '#fff',
    darkTextColor: 'rgb(29,155,240)',
    activeColor: `rgb(26,140,216)`,
    activeDarkColor: `rgb(26,140,216)`,
  },
  tag: {
    color: `rgb(239,243,244)`,
    darkColor: `rgb(32,35,39)`,
    textColor: '#536471',
    darkTextColor: '#71767b',
    activeColor: `rgba(239,243,244,0.5)`,
    activeDarkColor: `rgba(32,35,39,0.5)`,
  },
}

export interface StyledButtonProps {
  size?: 'middle' | 'large' | 'small' | 'mini'
  type?: 'default' | 'secondary' | 'primary' | 'tag'
  shape?: 'default' | 'rounded' | 'rectangular'
  onPress?: PressableProps['onPress']
  children?: string
  ghost?: boolean
  style?: ViewStyle
  textProps?: TextProps
  pressable?: boolean
  icon?: ReactNode
}

export default function StyledButton({
  size = 'middle',
  type = 'default',
  onPress,
  children,
  ghost,
  style,
  textProps,
  shape = 'default',
  pressable = true,
  icon,
}: StyledButtonProps) {
  const {
    color,
    activeColor,
    darkColor,
    activeDarkColor,
    textColor,
    darkTextColor,
  }: {
    color: string
    activeColor: string
    darkColor: string
    activeDarkColor: string
    textColor: string
    darkTextColor: string
  } = colors[type]

  const { color: btnTextColor } = ghost
    ? tw`dark:text-[${darkColor}] text-[${color}]`
    : tw`text-[${textColor}] dark:text-[${darkTextColor}]`

  return (
    <DebouncedPressable
      style={({ pressed }) =>
        tw.style(
          {
            middle: tw`h-9 px-4`,
            large: tw`h-[52px] px-8`,
            small: tw`h-8 px-3`,
            mini: tw`px-1 py-0.5`,
          }[size],
          {
            default: size === 'mini' ? tw`rounded` : tw`rounded-lg`,
            rounded: tw`rounded-full`,
            rectangular: tw`rounded-none`,
          }[shape],
          `flex-row items-center justify-center rounded-full border border-solid gap-1`,
          pressed && pressable
            ? tw.style(
                `border-[${activeColor}] dark:border-[${activeDarkColor}]`,
                !ghost && tw`bg-[${activeColor}] dark:bg-[${activeDarkColor}]`
              )
            : tw.style(
                `border-[${color}] dark:border-[${darkColor}]`,
                !ghost && tw`bg-[${color}] dark:bg-[${darkColor}]`,
                !pressable && tw`opacity-80`
              ),
          style
        )
      }
      onPress={ev => {
        if (pressable) {
          onPress?.(ev)
        }
      }}
    >
      {isValidElement(icon) &&
        cloneElement(icon as any, {
          color: btnTextColor,
        })}
      <Text
        {...textProps}
        style={[
          pick(tw.style(tw.style(getFontSize(size === 'mini' ? 6 : 5))), [
            'fontSize',
          ]) as any,
          { color: btnTextColor },
          textProps?.style,
        ]}
      >
        {children}
      </Text>
    </DebouncedPressable>
  )
}
