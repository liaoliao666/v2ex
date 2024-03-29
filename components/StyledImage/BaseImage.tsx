import { parseToRgba } from 'color2k'
import { Image, ImageBackground, ImageProps, ImageSource } from 'expo-image'
import { useAtomValue } from 'jotai'
import { isEqual, isObject, memoize, pick } from 'lodash-es'
import { View, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { genBMPUri } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

import AnimatedImageOverlay, { isAnimatingImage } from './AnimatedImageOverlay'
import BrokenImage from './BrokenImage'
import { imageResults } from './helper'
import { computeOptimalDispalySize } from './helper'

export interface BaseImageProps extends ImageProps {
  containerWidth?: number
}

const genPlaceholder = memoize((color: string) => {
  const [r, g, b, a = 1] = parseToRgba(color)
  return genBMPUri(1, [b, g, r, parseInt(String(a * 255), 10)])
})

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
      const nextImageResult = pick(ev.source, ['width', 'height', 'isAnimated'])
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
    placeholder: genPlaceholder(colors.neutral),
    placeholderContentFit: 'cover',
    style: tw.style(
      // Compute image size if style has no size
      !hasPassedSize && computeOptimalDispalySize(containerWidth, result),
      style as ViewStyle
    ),
  }

  if (!uri) return <View style={style} {...props} />

  if (result === 'error') {
    return (
      <BrokenImage
        onPress={() => {
          imageResults.set(uri, 'refetching')
          update()
        }}
        style={style}
      />
    )
  }

  if (props.autoplay === false) {
    const isAnimating = isAnimatingImage(uri)

    return (
      <ImageBackground
        {...imageProps}
        autoplay={isAnimating}
        allowDownscaling={props.allowDownscaling ?? !isAnimating}
      >
        {isObject(result) && !!result?.isAnimated && (
          <AnimatedImageOverlay
            isAnimating={isAnimating}
            update={update}
            uri={uri}
          />
        )}
      </ImageBackground>
    )
  }

  return <Image {...imageProps} />
}
