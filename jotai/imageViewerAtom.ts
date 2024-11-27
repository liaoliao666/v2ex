import { atom } from 'jotai'

import { StyledImageViewerProps } from '@/components/StyledImageViewer'

/**
 * 图片预览
 */
export const imageViewerAtom = atom<StyledImageViewerProps>({
  index: 0,
  visible: false,
  imageUrls: [],
})
