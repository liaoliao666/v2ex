import { Ionicons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { omit } from 'lodash-es'
import { forwardRef } from 'react'
import {
  Pressable,
  PressableProps,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const SearchBar = forwardRef<
  TextInput,
  {
    style?: ViewStyle
    editable?: boolean
    onPress?: PressableProps['onPress']
    value?: string
    onChangeText?: TextInputProps['onChangeText']
    onSubmitEditing?: TextInputProps['onSubmitEditing']
    autoFocus?: boolean
    placeholder?: string
  }
>(
  (
    {
      style,
      editable = true,
      onPress,
      value,
      onChangeText,
      onSubmitEditing,
      autoFocus,
      placeholder,
    },
    ref
  ) => {
    const { colors, fontSize } = useAtomValue(uiAtom)
    return (
      <Pressable
        style={tw.style(
          `flex-row items-center h-9 bg-[${colors.base200}] rounded-full`,
          style
        )}
        onPress={onPress}
      >
        <Ionicons
          name="search"
          size={18}
          color={colors.default}
          style={tw`pl-3`}
        />
        <TextInput
          ref={ref}
          placeholder={placeholder || '搜索V2EX内容'}
          placeholderTextColor={colors.default}
          style={tw.style(`px-3 py-1 flex-1 text-[${colors.foreground}]`, {
            ...omit(tw.style(fontSize.medium), ['lineHeight']),
            paddingVertical: 0,
          })}
          textAlignVertical="center"
          pointerEvents={editable ? 'auto' : 'none'}
          editable={editable}
          value={value}
          onChangeText={onChangeText}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={onSubmitEditing}
          autoCapitalize="none"
          selectionColor={colors.primary}
        />
        {editable && !!value && (
          <TouchableOpacity
            onPress={() => {
              onChangeText?.('')
            }}
            style={tw`h-4 w-4 items-center justify-center rounded-full mr-3 bg-[${colors.primary}]`}
          >
            <Ionicons
              name="close-sharp"
              size={14}
              color={'#fff'}
              style={tw`ml-0.5`}
            />
          </TouchableOpacity>
        )}
      </Pressable>
    )
  }
)

export default SearchBar
