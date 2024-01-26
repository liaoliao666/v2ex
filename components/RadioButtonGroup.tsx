import { useAtomValue } from 'jotai'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
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
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <View style={tw.style(`flex-row`, style)}>
      <View style={tw`flex-row p-0.5 rounded-lg bg-[${colors.base200}]`}>
        {options.map(item => {
          const active = value === item.value

          return (
            <Pressable
              key={item.value ?? '$k$'}
              onPress={() => {
                if (item.value !== value) {
                  onChange(item.value)
                }
              }}
              style={tw.style(
                `px-1.5 flex-row items-center rounded-lg`,
                active && `bg-[${colors.base100}]`
              )}
            >
              <Text
                style={tw.style(
                  fontSize.medium,
                  `text-[${active ? colors.foreground : colors.default}]`
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
