import { createContext, useContext } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import { HtmlContext } from './HtmlContext'

const TextRenderer: CustomTextualRenderer = props => {
  const { onSelectText, selectOnly } = useContext(HtmlContext)

  if (Platform.OS === 'ios' && selectOnly) {
    return <SelectableTextRenderer {...props} />
  }

  let renderProps = getNativePropsForTNode(props)

  if (Platform.OS === 'ios' && renderProps.selectable) {
    renderProps = {
      ...renderProps,
      selectable: false,
      onLongPress: onSelectText,
      suppressHighlighting: true,
    }
  }

  return <Text {...renderProps} />
}

const resetTextInputStyle = {
  paddingTop: 0,
  marginTop: -3,
  paddingBottom: 3,
}

const IsNestedTextContext = createContext(false)

const SelectableTextRenderer: CustomTextualRenderer = props => {
  const renderProps = getNativePropsForTNode(props)
  const isNestedText = useContext(IsNestedTextContext)

  if (isNestedText) return <Text {...renderProps} />

  return (
    <IsNestedTextContext.Provider value={true}>
      <TextInput editable={false} multiline style={resetTextInputStyle}>
        <Text {...renderProps} />
      </TextInput>
    </IsNestedTextContext.Provider>
  )
}

export default TextRenderer
