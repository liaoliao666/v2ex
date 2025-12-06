import { useAtomValue } from 'jotai'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { PressableProps, Text, View, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import DebouncedPressable from './DebouncedPressable'

export interface ListItemProps {
  label?: string
  icon: ReactNode
  action?: ReactNode
  onPress?: PressableProps['onPress']
  pressable?: boolean
  style?: ViewStyle
}

export default function ListItem({
  label,
  icon,
  action,
  onPress,
  pressable = true,
  style,
}: ListItemProps) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <DebouncedPressable
      style={({ pressed }) =>
        tw.style(
          `px-4 h-[56px] flex-row items-center`,
          pressed &&
            pressable &&
            !!label &&
            `bg-[${colors.foreground}] bg-opacity-10`,
          style
        )
      }
      onPress={onPress}
    >
      {({ pressed }) => (
        <>
          {!label && isValidElement(icon)
            ? cloneElement(icon as any, { pressed })
            : icon}

          {!!label && (
            <Text
              style={tw`ml-6 font-medium text-[${colors.foreground}] mr-auto ${fontSize.large}`}
            >
              {label}
            </Text>
          )}

          <View>{action}</View>
        </>
      )}
    </DebouncedPressable>
  )
}
