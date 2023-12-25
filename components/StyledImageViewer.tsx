import * as Sharing from 'expo-sharing'
import { ComponentProps } from 'react'
import { Text, View } from 'react-native'
import ImageViewer from 'react-native-image-viewing'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import tw from '@/utils/tw'

import IconButton from './IconButton'

export interface StyledImageViewerProps
  extends ComponentProps<typeof ImageViewer> {}

export default function StyledImageViewer(props: StyledImageViewerProps) {
  return (
    <ImageViewer
      FooterComponent={({ imageIndex }) => (
        <StyledImageViewerFooter
          images={props.images}
          imageIndex={imageIndex}
        />
      )}
      {...props}
    />
  )
}

function StyledImageViewerFooter({
  images,
  imageIndex,
}: {
  images: StyledImageViewerProps['images']
  imageIndex: number
}) {
  const safeAreaInsets = useSafeAreaInsets()

  return (
    <View
      style={tw`flex flex-row justify-between items-center px-8 pb-[${Math.max(
        safeAreaInsets.bottom,
        16
      )}px]`}
    >
      <View>
        <Text style={tw`text-[#fff] text-base`}>
          {imageIndex + 1} / {images.length}
        </Text>
      </View>
      <View style={tw`flex flex-row gap-x-2`}>
        <IconButton
          size={16}
          name="share-variant"
          color="#fff"
          activeColor="#fff"
          onPress={() => {
            Sharing.shareAsync((images[imageIndex] as any).uri!)
          }}
        />
      </View>
    </View>
  )
}
