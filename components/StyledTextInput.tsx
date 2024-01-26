import { useAtomValue } from 'jotai'
import { omit } from 'lodash-es'
import { forwardRef } from 'react'
import { TextInput, TextInputProps, TextStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const StyledTextInput = forwardRef<
  TextInput,
  TextInputProps & { size?: 'default' | 'large' }
>(({ size, ...props }, ref) => {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <TextInput
      ref={ref}
      autoCapitalize="none"
      placeholderTextColor={colors.default}
      selectionColor={tw.color(`text-[${colors.primary}]`)}
      {...props}
      style={tw.style(
        `bg-[${colors.base200}] h-9 px-3 rounded-lg text-[${colors.foreground}]`,
        size === 'large' ? `h-12` : `h-9`,
        {
          paddingTop: 0,
          paddingVertical: 0,
          ...omit(tw.style(fontSize.medium), ['lineHeight']),
        },
        props.style as TextStyle
      )}
    />
  )
})

export default StyledTextInput
