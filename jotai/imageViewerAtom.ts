import { atom } from 'jotai'

import { StyledImageViewerProps } from '@/components/StyledImageViewer'

export const imageViewerAtom = atom<StyledImageViewerProps>({
  index: 0,
  visible: false,
  imageUrls: [],
})
