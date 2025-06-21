// @ts-nocheck
import {
  SelectableText,
  SelectableTextProps,
} from '@alentoma/react-native-selectable-text'
import Clipboard from '@react-native-clipboard/clipboard'
import { decode } from 'js-base64'
import { useContext } from 'react'
import {
  CustomBlockRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'
import Toast from 'react-native-toast-message'

import { HtmlContext } from './HtmlContext'

// import { RenderContext, SelectableTextAncestor } from './context'

const menuItems = ['复制', 'Base64 解码']

const handleSelection: SelectableTextProps['onSelection'] = async payload => {
  const { eventType, content } = payload
  switch (eventType) {
    case `R_${menuItems[0]}`:
      try {
        Clipboard.setString(content)
        Toast.show({
          type: 'success',
          text1: `已复制到粘贴板`,
          text2: content,
        })
      } catch (err) {
        // empty
      }
      break
    case `R_${menuItems[1]}`:
      try {
        const result = decode(content)
        if (result) {
          Clipboard.setString(result)
          Toast.show({
            type: 'success',
            text1: `已复制到粘贴板`,
            text2: result,
          })
        } else {
          Toast.show({
            type: 'error',
            text1: `未识别到有效内容`,
          })
        }
      } catch (err) {
        // empty
      }
      break
    default:
      console.log('TO HANDLE SELECTION', payload)
  }
}

const SelectableTextRender: CustomBlockRenderer = props => {
  const renderProps = getNativePropsForTNode(props)
  const { onOpenURL } = useContext(HtmlContext)

  return (
    <SelectableText
      selectable
      value={renderProps.children as string}
      style={renderProps.style}
      menuItems={menuItems}
      onSelection={handleSelection}
      onPress={renderProps.onPress}
      onUrlPress={onOpenURL}
    />
  )
}

export default SelectableTextRender
