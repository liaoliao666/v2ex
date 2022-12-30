import { Pressable, Text, View } from 'react-native'

import tw from '@/utils/tw'

export default function RadioButtonGroup<
  T extends number | string | void | null
>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { label: string; value: T }[]
}) {
  return (
    <View style={tw`flex-row`}>
      <View
        style={tw`flex-row p-0.5 rounded-lg bg-[rgb(239,243,244)] dark:bg-[rgb(32,35,39)]`}
      >
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
                  `text-body-5`,
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
