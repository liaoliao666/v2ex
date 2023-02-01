import { ReactNode } from 'react'
import { PressableProps, Text } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

import DebouncePressable from './DebouncePressable'

export default function ListItem({
  label,
  icon,
  action,
  onPress,
  pressable = true,
}: {
  label: string
  icon: ReactNode
  action?: ReactNode
  onPress?: PressableProps['onPress']
  pressable?: boolean
}) {
  const fontSize = (tw.style(getFontSize(3)).fontSize as string) + 1
  return (
    <DebouncePressable
      style={({ pressed }) =>
        tw.style(
          `px-4 h-[56px] flex-row items-center`,
          pressed && pressable && `bg-message-press`
        )
      }
      onPress={onPress}
    >
      {icon}

      <Text
        style={tw.style(`ml-6 font-medium text-tint-primary mr-auto`, {
          fontSize,
        })}
      >
        {label}
      </Text>

      {action}
    </DebouncePressable>
  )
}
