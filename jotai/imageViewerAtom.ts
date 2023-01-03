import { atom } from 'jotai'
import ImageView from 'react-native-image-viewing'

export const imageViewerAtom = atom<Partial<Parameters<typeof ImageView>[0]>>({
  imageIndex: 0,
  visible: false,
  images: [],
})
