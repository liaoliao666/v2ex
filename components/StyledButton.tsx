import { useAtomValue } from 'jotai'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { PressableProps, Text, TextProps, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import DebouncedPressable from './DebouncedPressable'

export interface StyledButtonProps {
  size?: 'middle' | 'large' | 'small' | 'mini'
  type?: 'default' | 'primary' | 'tag'
  shape?: 'default' | 'rounded' | 'rectangular'
  onPress?: PressableProps['onPress']
  children?: string
  ghost?: boolean
  style?: ViewStyle
  textProps?: TextProps
  pressable?: boolean
  icon?: ReactNode
  color?: string
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
  color,
  icon,
}: StyledButtonProps) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  const textSize = tw.style(fontSize[size === 'mini' ? 'small' : 'medium'])
    .fontSize as number

  const buttonStyle = tw.style(
    size === 'middle' && `h-9 px-4`,
    size === 'large' && `h-[52px] px-8`,
    size === 'small' && `h-8 px-3`,
    size === 'mini' && `px-1 py-0.5`,
    shape === 'default' && (size === 'mini' ? tw`rounded` : tw`rounded-lg`),
    shape === 'rounded' && `rounded-full`,
    shape === 'rectangular' && `rounded-none`,
    `flex-row items-center justify-center rounded-full border border-solid gap-1`,
    type === 'primary' &&
      `border-[${colors.primary}] text-[${colors.primary}] dark:text-white`,
    !ghost &&
      type === 'primary' &&
      tw`bg-[${colors.primary}] text-[${colors.primaryContent}]`,
    type === 'tag' && `border-[${colors.base200}] text-[${colors.default}]`,
    !ghost &&
      type === 'tag' &&
      `bg-[${colors.base200}] text-[${colors.default}]`,
    type === 'default' &&
      `border-[#0f1419] dark:border-white text-[#0f1419] dark:text-white`,
    !ghost &&
      type === 'default' &&
      `bg-[#0f1419] dark:bg-white text-white dark:text-[#0f1419]`,
    color && `border-[${color}] text-[${color}]`,
    !ghost && color && `bg-[${color}] text-[#fff]`,
    !pressable && tw`opacity-80`,
    style
  )

  return (
    <DebouncedPressable
      style={({ pressed }) =>
        tw.style(buttonStyle, pressed && pressable && `opacity-80`)
      }
      onPress={ev => {
        if (pressable) {
          onPress?.(ev)
        }
      }}
    >
      {isValidElement(icon) &&
        cloneElement(icon as any, {
          color: buttonStyle.color,
        })}
      <Text
        {...textProps}
        style={[
          {
            color: buttonStyle.color as string,
            fontSize: textSize,
            lineHeight: textSize + 2,
          },
          textProps?.style,
        ]}
      >
        {children}
      </Text>
    </DebouncedPressable>
  )
}
