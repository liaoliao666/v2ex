import { isPlainObject } from 'lodash-es'
import { StyleProp } from 'react-native'

export function isStyle<T>(style: StyleProp<T>): style is T {
  return isPlainObject(style)
}
