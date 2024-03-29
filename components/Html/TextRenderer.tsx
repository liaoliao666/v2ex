import { useAtomValue } from 'jotai'
import { createContext, useContext } from 'react'
import { Platform, Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import { uiAtom } from '@/jotai/uiAtom'

import { HtmlContext } from './HtmlContext'

const IsNestedTextContext = createContext(false)

const resetTextInputStyle = {
  paddingTop: 0,
  marginTop: -3,
  paddingBottom: 3,
}

const TextRenderer: CustomTextualRenderer = props => {
  const { onSelectText, selectOnly } = useContext(HtmlContext)

  const { colors } = useAtomValue(uiAtom)

  let renderProps = getNativePropsForTNode(props)

  const isNestedText = useContext(IsNestedTextContext)

  let text = null

  if (isNestedText) {
    text = <Text selectionColor={colors.primary} {...renderProps} />
  } else if (Platform.OS === 'ios' && selectOnly) {
    text = (
      <TextInput
        editable={false}
        multiline
        style={resetTextInputStyle}
        selectionColor={colors.primary}
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

    text = <Text selectionColor={colors.primary} {...renderProps} />
  }

  return (
    <IsNestedTextContext.Provider value={true}>
      {text}
    </IsNestedTextContext.Provider>
  )
}

export default TextRenderer
