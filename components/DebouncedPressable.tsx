import { debounce } from 'lodash-es'
import { forwardRef } from 'react'
import { Pressable } from 'react-native'

import { invoke } from '@/utils/invoke'

const debouncePress = debounce(invoke, 500, {
  leading: true,
  trailing: false,
})

const DebouncedPressable: typeof Pressable = forwardRef((props, ref) => {
  return (
    <Pressable
      ref={ref}
      {...props}
      onPress={ev => debouncePress(() => props.onPress?.(ev))}
    />
  )
})

export default DebouncedPressable
