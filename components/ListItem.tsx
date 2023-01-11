import { ReactNode } from 'react'
import { Pressable, PressableProps, Text } from 'react-native'

import tw from '@/utils/tw'

export default function ListItem({
  label,
  icon,
  action,
  onPress,
}: {
  label: string
  icon: ReactNode
  action?: ReactNode
  onPress?: PressableProps['onPress']
}) {
  return (
    <Pressable
      style={({ pressed }) =>
        tw.style(
          `px-4 h-[56px] flex-row items-center`,
          pressed && `bg-message-press`
        )
      }
      onPress={onPress}
    >
      {icon}

      <Text style={tw`ml-6 text-[20px] font-medium text-tint-primary mr-auto`}>
        {label}
      </Text>

      {action}
    </Pressable>
  )
}
