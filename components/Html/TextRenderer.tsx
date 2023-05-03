import { some } from 'lodash-es'
import { useContext } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  TNode,
  getNativePropsForTNode,
} from 'react-native-render-html'

import { HtmlContext } from './HtmlContext'

const resetTextInputStyle = {
  paddingTop: 0,
  marginTop: -3,
  paddingBottom: 3,
}

const TextRenderer: CustomTextualRenderer = props => {
  const renderProps = getNativePropsForTNode(props)

  const { disabledPartialSelectable } = useContext(HtmlContext)

  if (
    disabledPartialSelectable ||
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

function hasLink(tnode: TNode): boolean {
  return tnode.domNode?.name === 'a' || some(tnode.children, hasLink)
}

export default TextRenderer
