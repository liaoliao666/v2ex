import { parseToRgba } from 'color2k'
import { Image, ImageBackground, ImageProps, ImageSource } from 'expo-image'
import * as Sharing from 'expo-sharing'
import { useAtomValue } from 'jotai'
import { isEqual, isObject, memoize, pick } from 'lodash-es'
import {
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
  useWindowDimensions,
} from 'react-native'
import ImageModal from 'react-native-image-modal'

import { uiAtom } from '@/jotai/uiAtom'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { genBMPUri } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

import AnimatedImageOverlay, {
  isAnimatingImage,
  setAnimatingImage,
} from './AnimatedImageOverlay'
import BrokenImage from './BrokenImage'
import { imageResults } from './helper'
import { computeOptimalDispalySize } from './helper'

export interface BaseImageProps extends ImageProps {
  containerWidth?: number
}

// const genPlaceholder = memoize((color: string) => {
//   const [r, g, b, a = 1] = parseToRgba(color)
//   return genBMPUri(1, [b, g, r, parseInt(String(a * 255), 10)])
// })

export function BaseImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  ...props
}: BaseImageProps) {
  const { colors } = useAtomValue(uiAtom)
  const uri = (source as ImageSource).uri
  const result = imageResults.get(uri)
  const update = useUpdate()
  const hasPassedSize = hasSize(style)
  const imageProps: ImageProps = {
    ...props,
    source,
    onLoad: ev => {
      const nextImageResult = pick(ev.source, [
        'width',
        'height',
        'isAnimated',
        'mediaType',
      ])
      if (!isEqual(result, nextImageResult)) {
        imageResults.set(uri, nextImageResult)
        if (!hasPassedSize) update()
      }
      onLoad?.(ev)
    },
    onError: err => {
      // TODO: This is a trick
      // Maybe fixed in next expo-image version
      if (!hasSize(result)) {
        imageResults.set(uri, 'error')
        update()
      }
      onError?.(err)
    },
    // placeholderContentFit: 'cover',
    style: tw.style(
      // Compute image size if style has no size
      !hasPassedSize && computeOptimalDispalySize(containerWidth, result),
      style as ViewStyle
    ),
  }
  const layout = useWindowDimensions()

  if (!uri) return <View style={style as StyleProp<ViewStyle>} {...props} />

  if (result === 'error') {
    return (
      <BrokenImage
        onPress={() => {
          imageResults.set(uri, 'refetching')
          update()
        }}
        style={style as StyleProp<ViewStyle>}
      />
    )
  }

  if (props.autoplay === false) {
    const isAnimating = isAnimatingImage(uri)
    const isMiniImage =
      isObject(result) && result.width < 50 && result.height < 50
    const disabled = !result || result === 'refetching' || isMiniImage

    return (
      <ImageModal
        disabled={disabled}
        imageBackgroundColor={!isObject(result) ? colors.neutral : undefined}
        style={imageProps.style}
        source={source}
        isTranslucent
        hideCloseButton
        onClose={() => {
          setAnimatingImage('')
        }}
        onLongPress={() => {
          if (!disabled) {
            Sharing.shareAsync(uri)
          }
        }}
        renderImageComponent={({ source, resizeMode, style, isModalOpen }) => (
          <ImageBackground
            {...(imageProps as ViewProps)}
            autoplay={isAnimating}
            style={style as StyleProp<ViewStyle>}
            source={source}
            allowDownscaling={!isModalOpen}
            resizeMode={resizeMode}
            // contentFit="none"
          >
            {isObject(result) && !isMiniImage && !!result?.isAnimated && (
              <AnimatedImageOverlay
                isAnimating={isAnimating}
                update={update}
                uri={uri}
              />
            )}
          </ImageBackground>
        )}
      />
    )
  }

  return <Image {...imageProps} />
}
