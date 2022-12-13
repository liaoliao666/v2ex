import { Platform, Text, TextInput, TextProps, View } from 'react-native'

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'space-mono' }]} />
}

export default function StyledText({ children, ...props }: TextProps) {
  return Platform.OS === 'ios' ? (
    <View>
      <TextInput
        value={children as string}
        editable={false}
        multiline
        {...props}
      />
    </View>
  ) : (
    <Text selectable {...props}>
      {children}
    </Text>
  )
}
