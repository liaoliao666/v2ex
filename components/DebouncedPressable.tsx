import { debounce } from 'lodash-es'
import { forwardRef, useRef } from 'react'
import { Pressable } from 'react-native'

import { invoke } from '@/utils/invoke'

const debouncePress = debounce(invoke, 500, {
  leading: true,
  trailing: false,
})

const DebouncedPressable: typeof Pressable = forwardRef((props, ref) => {
  const touchActivatePositionRef = useRef<{ pageX: number; pageY: number }>({
    pageX: 0,
    pageY: 0,
  })

  return (
    <Pressable
      ref={ref}
      {...props}
      onPressIn={ev => {
        const { pageX, pageY } = ev.nativeEvent
        touchActivatePositionRef.current = {
          pageX,
          pageY,
        }
        props.onPressIn?.(ev)
      }}
      onPress={ev =>
        debouncePress(() => {
          const { pageX, pageY } = ev.nativeEvent
          const absX = Math.abs(touchActivatePositionRef.current.pageX - pageX)
          const absY = Math.abs(touchActivatePositionRef.current.pageY - pageY)
          const dragged = absX > 2 || absY > 2

          if (!dragged) {
            props.onPress?.(ev)
          }
        })
      }
    />
  )
})

export default DebouncedPressable
