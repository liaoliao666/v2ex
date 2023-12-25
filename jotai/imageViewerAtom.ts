import { atom } from 'jotai'

import { StyledImageViewerProps } from '@/components/StyledImageViewer'

/**
 * 图片预览
 */
export const imageViewerAtom = atom<
  Pick<StyledImageViewerProps, 'images' | 'imageIndex' | 'visible'>
>({
  imageIndex: 0,
  visible: false,
  images: [],
})
