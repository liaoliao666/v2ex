import { createContext, useContext } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import tw from '@/utils/tw'

import { HtmlContext } from './HtmlContext'

const IsNestedTextContext = createContext(false)

const resetTextInputStyle = {
  paddingTop: 0,
  marginTop: -3,
  paddingBottom: 3,
}

const TextRenderer: CustomTextualRenderer = props => {
  const { onSelectText, selectOnly } = useContext(HtmlContext)

  let renderProps = getNativePropsForTNode(props)

  const isNestedText = useContext(IsNestedTextContext)

  let text = null

  if (isNestedText) {
    text = <Text selectionColor={tw.color(`text-primary`)} {...renderProps} />
  } else if (Platform.OS === 'ios' && selectOnly) {
    text = (
      <TextInput
        editable={false}
        multiline
        style={resetTextInputStyle}
        selectionColor={tw.color(`text-primary`)}
      >
        <Text {...renderProps} />
      </TextInput>
    )
  } else {
    if (Platform.OS === 'ios' && renderProps.selectable) {
      renderProps = {
        ...renderProps,
        selectable: false,
        onLongPress: onSelectText,
        suppressHighlighting: true,
      }
    }

    text = <Text selectionColor={tw.color(`text-primary`)} {...renderProps} />
  }

  return (
    <IsNestedTextContext.Provider value={true}>
      {text}
    </IsNestedTextContext.Provider>
  )
}

export default TextRenderer
