import { useCallback, useRef } from 'react'
import { Pressable, PressableProps } from 'react-native'

export default function StyledPressable(props: PressableProps) {
  const pressInPagePointRef = useRef({ x: 0, y: 0 })

  const onPressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    e => {
      pressInPagePointRef.current = {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      }

      if (props.onPressIn) props.onPressIn(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onPressIn]
  )

  const onPressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    e => {
      if (props.onPressOut) props.onPressOut(e)

      const [x, y] = [e.nativeEvent.pageX, e.nativeEvent.pageY]
      if (
        Math.abs(pressInPagePointRef.current.x - x) > 1 ||
        Math.abs(pressInPagePointRef.current.y - y) > 1
      ) {
        e.preventDefault()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onPressOut]
  )

  const onPress = useCallback<NonNullable<PressableProps['onPress']>>(
    e => {
      if (e.isDefaultPrevented()) return
      if (props.onPress) props.onPress(e)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onPress]
  )
  return (
    <Pressable
      {...props}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    />
  )
}
