import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

const resetTextInputStyle = {
  paddingTop: 0,
  paddingVertical: 0,
  marginTop: -3,
  paddingBottom: 3,
}

const TextRenderer: CustomTextualRenderer = props => {
  const renderProps = getNativePropsForTNode(props)

  if (!renderProps.selectable || Platform.OS === 'android')
    return <Text {...renderProps} />

  return (
    <TextInput
      editable={false}
      multiline
      style={resetTextInputStyle}
      textAlignVertical="top"
    >
      <Text {...renderProps} />
    </TextInput>
  )
}

export default TextRenderer
