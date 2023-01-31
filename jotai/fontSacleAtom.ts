import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export type FontScale = 'medium' | 'large' | 'super'

/**
 * 字体缩放大小
 */
export const fontScaleAtom = atomWithStorage<FontScale>(
  'fontScale',
  'medium',
  storage
)
