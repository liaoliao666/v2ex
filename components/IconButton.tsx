import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { Pressable, PressableProps, View } from 'react-native'

import tw from '@/utils/tw'

const RATIO = 1.7

export default function IconButton({
  color,
  activeColor,
  name,
  size = 22.5,
  onPress,
  active,
  icon,
  pressed: outerPressed,
}: {
  backgroundColor?: string
  color?: string
  activeColor?: string
  size?: number
  name?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  onPress?: PressableProps['onPress']
  active?: boolean
  icon?: ReactNode
  pressed?: boolean
}) {
  const blurSize = size * RATIO

  function renderIconButton(pressed: boolean) {
    return (
      <View style={tw`items-center justify-center`}>
        <View
          style={tw.style(
            `w-[${blurSize}px] h-[${blurSize}px] -m-[${
              (blurSize - size) / 2
            }px] rounded-full overflow-hidden absolute`,
            pressed && `bg-[${activeColor}] bg-opacity-20`
          )}
        />
        {isValidElement(icon) ? (
          cloneElement(icon as any, {
            size,
            color: pressed || active ? activeColor : color,
          })
        ) : (
          <MaterialCommunityIcons
            name={name}
            size={size}
            color={pressed || active ? activeColor : color}
          />
        )}
      </View>
    )
  }

  return typeof outerPressed === 'boolean' ? (
    renderIconButton(outerPressed)
  ) : (
    <Pressable onPress={onPress} style={tw`flex-row items-center`}>
      {({ pressed: innerPressed }) => renderIconButton(innerPressed)}
    </Pressable>
  )
}
