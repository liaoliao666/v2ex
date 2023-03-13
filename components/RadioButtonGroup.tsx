import { Pressable, Text, View, ViewStyle } from 'react-native'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

export default function RadioButtonGroup<
  T extends number | string | void | null
>({
  value,
  onChange,
  options,
  style,
}: {
  value: T
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  style?: ViewStyle
}) {
  return (
    <View style={tw.style(`flex-row`, style)}>
      <View style={tw`flex-row p-0.5 rounded-lg bg-input`}>
        {options.map(item => {
          const active = value === item.value

          return (
            <Pressable
              key={item.value ?? '0'}
              onPress={() => {
                onChange(item.value)
              }}
              style={tw.style(
                `px-1.5 flex-row items-center rounded-lg`,
                active && `bg-white dark:bg-black`
              )}
            >
              <Text
                style={tw.style(
                  getFontSize(5),
                  active ? `text-tint-primary` : `text-tint-secondary`
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
