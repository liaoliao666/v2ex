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

export interface StyledImageViewerProps
  extends Omit<ComponentProps<typeof ImageViewer>, 'onCancel'> {
  visible?: boolean
  onClose?: () => void
}

export default function StyledImageViewer({
  visible,
  onClose,
  ...props
}: StyledImageViewerProps) {
  const safeAreaInsets = useSafeAreaInsets()

  const { fontSize } = useAtomValue(uiAtom)

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <ImageViewer
        enableSwipeDown
        onCancel={onClose}
        renderHeader={currentIndex => (
          <View
            style={tw`pt-[${safeAreaInsets.top}px] px-4 z-20 absolute top-0 inset-x-0 flex-row justify-between`}
          >
            <IconButton
              size={24}
              color="#fff"
              activeColor="#fff"
              icon={<Ionicons name="close-sharp" />}
              onPress={onClose}
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
            style={tw`pt-[${safeAreaInsets.top}px] px-4 z-10 absolute top-0 inset-x-0 flex-row justify-center`}
          >
            <Text style={tw`text-white ${fontSize.large}`}>
              {currentIndex + ' / ' + allSize}
            </Text>
          </View>
        )}
        renderImage={imageProps => {
          return <Image {...imageProps} />
        }}
        saveToLocalByLongPress={false}
        {...props}
      />
    </Modal>
  )
}
