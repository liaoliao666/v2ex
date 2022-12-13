import { FlexStyle } from 'react-native'

export function hasSize(style: FlexStyle) {
  return !!(style.width && style.height)
}
