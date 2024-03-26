import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as Sharing from 'expo-sharing'
import { useAtomValue } from 'jotai'
import { ComponentProps } from 'react'
import { Modal, Text, View } from 'react-native'
import ImageViewer from 'react-native-image-zoom-viewer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import IconButton from './IconButton'
import { NAV_BAR_HEIGHT } from './NavBar'
import { setGifId } from './StyledImage'

export interface StyledImageViewerProps
  extends Omit<ComponentProps<typeof ImageViewer>, 'onCancel'> {
  visible?: boolean
  onClose?: () => void
}

export default function StyledImageViewer({
  visible,
  ...props
}: StyledImageViewerProps) {
  const safeAreaInsets = useSafeAreaInsets()
  const { fontSize } = useAtomValue(uiAtom)

  const handleClose = () => {
    setGifId('')
    props.onClose?.()
  }

  return (
    <Modal transparent visible={visible} onRequestClose={handleClose}>
      <ImageViewer
        enableSwipeDown
        onCancel={handleClose}
        renderHeader={currentIndex => (
          <View
            style={tw`h-[${NAV_BAR_HEIGHT}px] w-full px-4 z-20 absolute top-[${safeAreaInsets.top}px] inset-x-0 flex-row justify-between items-center`}
          >
            <IconButton
              size={24}
              color="#fff"
              activeColor="#fff"
              icon={<Ionicons name="close-sharp" />}
              onPress={handleClose}
            />

            <IconButton
              size={24}
              color="#fff"
              activeColor="#fff"
              name="share-outline"
              onPress={() => {
                Sharing.shareAsync(props.imageUrls[currentIndex!].url)
              }}
            />
          </View>
        )}
        renderIndicator={(currentIndex, allSize) => (
          <View
            style={tw`px-4 z-10 absolute h-[${NAV_BAR_HEIGHT}px] top-[${safeAreaInsets.top}px] inset-x-0 flex-row items-center justify-center`}
          >
            <Text style={tw`text-white ${fontSize.large}`}>
              {currentIndex + ' / ' + allSize}
            </Text>
          </View>
        )}
        renderImage={imageProps => {
          return <Image {...imageProps} autoplay />
        }}
        saveToLocalByLongPress={false}
        {...props}
      />
    </Modal>
  )
}
