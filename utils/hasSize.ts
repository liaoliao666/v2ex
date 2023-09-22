import { isPlainObject } from 'lodash-es'

export type Size = { width: number; height: number; [k: string]: any }

export function hasSize(style: any): style is Size {
  return isPlainObject(style) && !!(style.width && style.height)
}
