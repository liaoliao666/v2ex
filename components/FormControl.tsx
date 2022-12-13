import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from 'react-hook-form'
import { Text, View } from 'react-native'
import { ViewStyle } from 'react-native'

import tw from '@/utils/tw'

interface FormControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends ControllerProps<TFieldValues, TName> {
  label?: string
  style?: ViewStyle
}

export default function FormControl<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ label, style, render, ...rest }: FormControlProps<TFieldValues, TName>) {
  return (
    <Controller
      {...rest}
      render={props => (
        <View style={style}>
          {!!label && (
            <Text style={tw`text-tint-primary text-body-5 mb-1`}>{label}</Text>
          )}
          {render(props)}
          <View style={tw`h-4`}>
            {!!props.fieldState.error?.message && (
              <Text style={tw`text-body-6 text-[#ff4d4f]`}>
                {props.fieldState.error?.message}
              </Text>
            )}
          </View>
        </View>
      )}
    />
  )
}
