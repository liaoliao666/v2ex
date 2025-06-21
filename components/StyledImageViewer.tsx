import Ionicons from 'react-native-vector-icons/Ionicons'
import { useAtomValue } from 'jotai'
import { ComponentProps } from 'react'
import { Dimensions, Modal, Platform, Text, View, Share } from 'react-native'
import FastImage from 'react-native-fast-image'
import ImageViewer from 'react-native-image-zoom-viewer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import IconButton from './IconButton'
import { NAV_BAR_HEIGHT } from './NavBar'

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
    <Modal
      hardwareAccelerated
      statusBarTranslucent={true}
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <ImageViewer
        style={
          Platform.OS === 'android'
            ? {
                width: Dimensions.get('screen').width,
                height: Dimensions.get('screen').height,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }
            : undefined
        }
        useNativeDriver
        enableSwipeDown
        onCancel={onClose}
        renderHeader={currentIndex => (
          <View
            style={tw`h-[${NAV_BAR_HEIGHT}px] w-full px-4 z-20 absolute top-[${safeAreaInsets.top}px] inset-x-0 flex-row justify-between items-center`}
          >
            <IconButton
              size={24}
              color="#fff"
              activeColor="#fff"
              icon={<Ionicons name="close-sharp" />}
              {...{
                [Platform.OS === 'android' ? 'onPressIn' : 'onPress']: onClose,
              }}
            />

            <IconButton
              size={24}
              color="#fff"
              activeColor="#fff"
              name="share-outline"
              {...{
                [Platform.OS === 'android' ? 'onPressIn' : 'onPress']: () => {
                  Share.share({
                    url: props.imageUrls[currentIndex!].url,
                  })
                },
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
        renderImage={imageProps => (
          <FastImage {...imageProps} />
        )}
        saveToLocalByLongPress={false}
        {...props}
      />
    </Modal>
  )
}
