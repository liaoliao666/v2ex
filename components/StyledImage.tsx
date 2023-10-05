import { load } from 'cheerio'
import { Image, ImageProps } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import {
  isArray,
  isEqual,
  isObject,
  isPlainObject,
  isString,
  pick,
} from 'lodash-es'
import { View, ViewStyle } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'
import { suspend } from 'suspend-react'

import { hasSize } from '@/utils/hasSize'
import { request } from '@/utils/request'
import tw from '@/utils/tw'
import { isGifURL, isSvgURL, resolveURL } from '@/utils/url'
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
  const uri = isObject(source) && !isArray(source) ? source.uri : undefined
  const size = uriToSize.get(uri)
  const update = useUpdate()

  return (
    <Image
      {...props}
      source={source}
      onLoad={ev => {
        const newSize: any = pick(ev.source, ['width', 'height'])
        if (!isEqual(size, newSize)) {
          uriToSize.set(uri, newSize)
          update()
        }
        onLoad?.(ev)
      }}
      onError={err => {
        // TODO: This is a trick
        // maybe fixed in next expo-image version
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

async function getSvgInfo(url: string) {
  const { data: xml } = await request.get<string>(url!)
  const $ = load(xml)
  const $svg = $('svg')

  let width: number
  let height: number

  if ($svg.attr('width') && $svg.attr('height')) {
    width = parseFloat($svg.attr('width') as string)
    height = parseFloat($svg.attr('height') as string)
  } else {
    const viewBox = $svg.attr('viewBox') || ''
    ;[, , width, height] = viewBox
      .split(viewBox.includes(',') ? ',' : ' ')
      .map(parseFloat)
  }

  return {
    xml,
    size: {
      width,
      height,
    },
  }
}

function imageLoadingRender({
  style,
  containerWidth,
}: {
  containerWidth?: number
  style?: any
}) {
  return (
    <View
      style={tw.style(
        !hasSize(style) && computeImageSize(containerWidth),
        `img-loading`,
        style
      )}
    />
  )
}

const SuspenseSvg = withQuerySuspense(
  ({
    uri,
    style,
    containerWidth,
    ...props
  }: UriProps & { containerWidth?: number }) => {
    const { xml, size } = suspend(getSvgInfo, [uri!])
    const svgStyle = computeImageSize(containerWidth, size)

    return (
      <SvgXml
        {...props}
        xml={xml}
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
  },
  {
    loadingRender: imageLoadingRender,
    fallbackRender: () => null,
  }
)

async function getCompressedImage(uri: string) {
  try {
    const staticImage = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return {
      uri: staticImage.uri,
      size: pick(staticImage, ['width', 'height']),
    }
  } catch (error) {
    return { uri }
  }
}

const SuspenseImage = withQuerySuspense(
  (props: StyledImageProps) => {
    const { uri, size } = suspend(getCompressedImage, [
      (props.source as any).uri!,
    ])
    if (!uriToSize.has(uri) && hasSize(size)) {
      uriToSize.set(uri, size)
    }

    return <StyledImage {...props} source={{ ...(props.source as any), uri }} />
  },
  {
    loadingRender: imageLoadingRender,
    fallbackRender: () => null,
  }
)

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

  if (actualWidth === containerWidth) {
    return {
      aspectRatio,
      width: `100%`,
    }
  }

  return {
    width: actualWidth,
    height: actualWidth / aspectRatio,
  }
}

function StyledImage({ source, ...props }: StyledImageProps) {
  const resolvedURI =
    isObject(source) && !isArray(source) && isString(source.uri)
      ? resolveURL(source.uri)
      : undefined

  if (isString(resolvedURI) && isSvgURL(resolvedURI)) {
    return <SuspenseSvg uri={resolvedURI} {...(props as any)} />
  }

  if (isString(resolvedURI) && isGifURL(resolvedURI) && !hasSize(props.style)) {
    return (
      <SuspenseImage
        {...props}
        source={
          isObject(source)
            ? {
                ...source,
                uri: resolvedURI,
              }
            : source
        }
      />
    )
  }

  return (
    <CustomImage
      {...props}
      source={
        isObject(source)
          ? {
              ...source,
              uri: resolvedURI,
            }
          : source
      }
    />
  )
}

export default StyledImage
