import { useContext } from 'react'
import { Platform, Text } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import { HtmlContext } from './HtmlContext'

const TextRenderer: CustomTextualRenderer = props => {
  const { onSelectText } = useContext(HtmlContext)
  let renderProps = getNativePropsForTNode(props)

  if (Platform.OS === 'ios' && renderProps.selectable) {
    renderProps = {
      ...renderProps,
      selectable: false,
      onLongPress: () => {
        onSelectText()
      },
    }
  }

  return <Text {...renderProps} />
}

export default TextRenderer
