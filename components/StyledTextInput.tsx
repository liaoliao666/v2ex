import { pick } from 'lodash-es'
import { forwardRef } from 'react'
import { TextInput, TextInputProps, TextStyle } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

const StyledTextInput = forwardRef<
  TextInput,
  TextInputProps & { size?: 'default' | 'large' }
>(({ size, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      autoCapitalize="none"
      placeholderTextColor={tw.color(`text-tint-secondary`)}
      {...props}
      style={tw.style(
        `bg-[rgb(239,243,244)] dark:bg-[rgb(32,35,39)] h-9 px-3 rounded-lg text-tint-primary`,
        size === 'large' ? `h-12` : `h-9`,
        {
          paddingTop: 0,
          paddingVertical: 0,
          ...pick(tw.style(getFontSize(5)), ['fontSize']),
        },
        props.style as TextStyle
      )}
    />
  )
})

export default StyledTextInput
