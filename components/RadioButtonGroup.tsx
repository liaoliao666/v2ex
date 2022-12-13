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
        style={tw`flex-row border-tint-border border border-solid rounded overflow-hidden`}
      >
        {options.map((item, index) => {
          const active = value === item.value

          return (
            <Pressable
              key={item.value ?? '0'}
              onPress={() => {
                onChange(item.value)
              }}
              style={tw.style(
                `px-1.5 flex-row items-center`,
                active && `bg-primary-focus`,
                index !== 0 &&
                  !active &&
                  `border-l border-tint-border border-solid`
              )}
            >
              <Text
                style={tw.style(
                  `text-body-5`,
                  active ? `text-white` : `text-tint-primary`
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
