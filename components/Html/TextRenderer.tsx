import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  TPhrasing,
  TText,
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

  if (
    !renderProps.selectable ||
    Platform.OS === 'android' ||
    hasLink(props.tnode)
  )
    return <Text {...renderProps} />

  return (
    <TextInput
      editable={false}
      multiline
      scrollEnabled={false}
      style={resetTextInputStyle}
      textAlignVertical="top"
    >
      <Text {...renderProps} />
    </TextInput>
  )
}

function hasLink(tnode: TText | TPhrasing) {
  return (
    tnode.domNode?.name === 'a' ||
    tnode.children.some(child => child.domNode?.name === 'a')
  )
}

export default TextRenderer
