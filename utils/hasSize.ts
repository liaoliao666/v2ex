import { isNumber, isPlainObject } from 'lodash-es'

export function hasSize(
  style: any
): style is { width: number; height: number; [k: string]: any } {
  return isPlainObject(style) && isNumber(style.width) && isNumber(style.height)
}
