import { ReactNode } from 'react'
import { PressableProps, Text } from 'react-native'

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

      <Text style={tw`ml-6 text-[20px] font-medium text-tint-primary mr-auto`}>
        {label}
      </Text>

      {action}
    </DebouncePressable>
  )
}
