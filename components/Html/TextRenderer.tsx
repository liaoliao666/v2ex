import { isString } from 'lodash-es'
import { Text, TextInput } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import tw from '@/utils/tw'

const TextRenderer: CustomTextualRenderer = props => {
  const renderProps = getNativePropsForTNode(props)

  return renderProps.selectable && isString(renderProps.children) ? (
    <TextInput
      editable={false}
      multiline
      {...renderProps}
      style={[renderProps.style, tw`pt-0`]}
    />
  ) : (
    <Text {...renderProps} />
  )
}

export default TextRenderer
