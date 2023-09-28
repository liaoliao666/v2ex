import { Image, ImageProps } from 'expo-image'
import {
  isArray,
  isEqual,
  isObject,
  isPlainObject,
  isString,
  pick,
} from 'lodash-es'
import { useSuspenseQuery } from 'quaere'
import { View, ViewStyle } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { svgQuery } from '@/servicies/other'
import { getCompressedImage } from '@/utils/compressImage'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { isSvgURL, resolveURL } from '@/utils/url'
import { use } from '@/utils/use'
import useUpdate from '@/utils/useUpdate'

import { withQuerySuspense } from './QuerySuspense'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
}

type Size = { width: number; height: number }

const uriToSize = new Map<string | undefined, Size | 'error'>()

function CustomImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  ...props
}: StyledImageProps) {
  const uri =
    isObject(source) && !isArray(source) && isString(source.uri)
      ? resolveURL(source.uri)
      : undefined

  const size = uriToSize.get(uri)
  const update = useUpdate()

  return (
    <Image
      {...props}
      source={
        isObject(source)
          ? {
              ...source,
              uri,
            }
          : source
      }
      onLoad={ev => {
        const newSize: any = pick(ev.source, ['width', 'height'])
        if (!isEqual(size, newSize)) {
          uriToSize.set(uri, newSize)
          update()
        }
        onLoad?.(ev)
      }}
      onError={err => {
        // TODO: This is a trick, maybe fixed in next expo-image version
        if (!hasSize(size)) {
          uriToSize.set(uri, 'error')
          update()
        }
        onError?.(err)
      }}
      style={tw.style(
        // Display loading if image size is not available
        !size && 'img-loading',
        // Compute image size if style has no size
        !hasSize(style) && computeImageSize(containerWidth, size),
        style as ViewStyle
      )}
    />
  )
}

function computeImageSize(
  containerWidth?: number,
  size?: Size | 'error'
): ViewStyle {
  const MAX_IMAGE_HEIGHT = 510

  // Hide image if error
  if (size === 'error') {
    return {
      width: 0,
      height: 0,
    }
  }

  // Display placeholder size if image size is not available
  if (!hasSize(size)) {
    return {
      aspectRatio: 1,
      width: containerWidth
        ? Math.min(containerWidth, MAX_IMAGE_HEIGHT)
        : `100%`,
    }
  }

  const isMiniImage = size.width < 100 && size.height < 100

  // Display mini image
  if (isMiniImage) {
    return size
  }

  // Display image with max height
  const aspectRatio = size.width / size.height

  if (!containerWidth) {
    return {
      aspectRatio,
      width: `100%`,
    }
  }

  const actualWidth = Math.min(aspectRatio * MAX_IMAGE_HEIGHT, containerWidth)

  return {
    width: actualWidth,
    height: actualWidth / aspectRatio,
  }
}

function CustomSvgUri({
  uri,
  style,
  containerWidth,
  ...props
}: UriProps & { containerWidth?: number }) {
  const { data: svg } = useSuspenseQuery({
    query: svgQuery,
    variables: { url: uri! },
  })

  const svgStyle = computeImageSize(containerWidth, svg)

  return (
    <SvgXml
      {...props}
      xml={svg.xml}
      style={
        (isArray(style)
          ? [svgStyle, ...style]
          : {
              ...svgStyle,
              ...(isPlainObject(style) && (style as any)),
            }) as any
      }
      width="100%"
    />
  )
}

function StyledImage({ source, ...props }: StyledImageProps) {
  if (isObject(source) && !isArray(source) && isString(source.uri)) {
    if (isSvgURL(source.uri))
      return <CustomSvgUri uri={source.uri} {...(props as any)} />

    if (!hasSize(props.style)) {
      const { uri, size } = use(getCompressedImage(source.uri))
      if (!uriToSize.has(uri) && hasSize(size)) {
        uriToSize.set(uri, size)
      }
      return <CustomImage source={{ ...source, uri }} {...props} />
    }
  }

  return <CustomImage source={source} {...props} />
}

export default withQuerySuspense(StyledImage, {
  loadingRender: ({ style, containerWidth }) => {
    return (
      <View
        style={tw.style(
          !hasSize(style) && computeImageSize(containerWidth),
          `img-loading`,
          style as any
        )}
      />
    )
  },
  fallbackRender: () => {
    return null
  },
})
