import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { ReactNode, cloneElement, isValidElement } from 'react'
import { Pressable, PressableProps, View, ViewStyle } from 'react-native'

import tw from '@/utils/tw'

const RATIO = 1.7

export interface IconButtonProps {
  backgroundColor?: string
  color?: string
  activeColor?: string
  size?: number
  name?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  onPress?: PressableProps['onPress']
  onPressIn?: PressableProps['onPressIn']
  onPressOut?: PressableProps['onPressOut']
  active?: boolean
  icon?: ReactNode
  pressed?: boolean
  style?: ViewStyle
}

export default function IconButton(props: IconButtonProps) {
  return typeof props.pressed === 'boolean' ? (
    <IconButtonImpl {...props} />
  ) : (
    <Pressable
      onPress={props.onPress}
      onPressIn={props.onPressIn}
      onPressOut={props.onPressOut}
      style={tw`flex-row items-center`}
    >
      {({ pressed }) => <IconButtonImpl {...props} pressed={pressed} />}
    </Pressable>
  )
}

function IconButtonImpl({
  color,
  activeColor,
  name,
  size = 22.5,
  active,
  icon,
  pressed,
  style,
}: IconButtonProps) {
  const blurSize = size * RATIO

  return (
    <View style={tw.style(`items-center justify-center`, style)}>
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
