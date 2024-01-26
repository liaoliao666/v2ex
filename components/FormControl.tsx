import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import { Text, View } from 'react-native'
import { ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends ControllerProps<TFieldValues, TName> {
  label?: string
  style?: ViewStyle
  extra?: ReactNode
}

export default function FormControl<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  style,
  render,
  extra,
  ...rest
}: FormControlProps<TFieldValues, TName>) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <Controller
      {...rest}
      render={props => (
        <View style={style}>
          <View style={tw`flex flex-row justify-between items-center`}>
            {!!label && (
              <Text
                style={tw.style(
                  `text-[${colors.foreground}] ${fontSize.medium} mb-1`
                )}
              >
                {label}
              </Text>
            )}

            {extra}
          </View>
          {render(props)}
          <View style={tw`min-h-[16px]`}>
            {!!props.fieldState.error?.message && (
              <Text style={tw`text-[#ff4d4f] text-[13px]`}>
                {props.fieldState.error?.message}
              </Text>
            )}
          </View>
        </View>
      )}
    />
  )
}
