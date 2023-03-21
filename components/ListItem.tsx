import { ReactNode } from 'react'
import { PressableProps, Text } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

import DebouncedPressable from './DebouncedPressable'

export default function ListItem({
  label,
  icon,
  action,
  onPress,
  pressable = true,
}: {
  label?: string
  icon: ReactNode
  action?: ReactNode
  onPress?: PressableProps['onPress']
  pressable?: boolean
}) {
  return (
    <DebouncedPressable
      style={({ pressed }) =>
        tw.style(
          `px-4 h-[56px] flex-row items-center`,
          pressed && pressable && !!label && `bg-message-press`
        )
      }
      onPress={onPress}
    >
      {icon}

      {!!label && (
        <Text
          style={tw`ml-6 font-medium text-tint-primary mr-auto ${getFontSize(
            4
          )}`}
        >
          {label}
        </Text>
      )}

      {action}
    </DebouncedPressable>
  )
}
