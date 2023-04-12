import { encode } from 'js-base64'
import { TextInputSelectionChangeEventData } from 'react-native'
import Toast from 'react-native-toast-message'

export function convertSelectedTextToBase64(
  content: string = '',
  selection: TextInputSelectionChangeEventData['selection'] | void
) {
  if (!selection || selection.start === selection.end) {
    Toast.show({
      type: 'error',
      text1: '请选择文字后再点击',
    })
    return
  }

  const replacedText = `${content.substring(0, selection.start)}${encode(
    content.substring(selection.start, selection.end)
  )}${content.substring(selection.end, content.length)}`

  return replacedText
}
