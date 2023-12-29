import { load } from 'cheerio'
import { Image, ImageBackground, ImageProps } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import {
  isArray,
  isEqual,
  isObject,
  isPlainObject,
  isString,
  pick,
} from 'lodash-es'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { View, ViewStyle } from 'react-native'
import { Text } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'
import { suspend } from 'suspend-react'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { hasSize } from '@/utils/hasSize'
import { request } from '@/utils/request'
import tw from '@/utils/tw'
import { isGifURL, isSvgURL, resolveURL } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
  isGif?: boolean
}

type Size = { width: number; height: number }

export const uriToSize = new Map<string | undefined, Size | 'error'>()

function BasicImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  isGif,
  ...props
}: StyledImageProps) {
  const uri = isObject(source) && !isArray(source) ? source.uri : undefined
  const size = uriToSize.get(uri)
  const update = useUpdate()
  const imageProps: ImageProps = {
    ...props,
    source,
    onLoad: ev => {
      const newSize: any = pick(ev.source, ['width', 'height'])
      if (!isEqual(size, newSize)) {
        uriToSize.set(uri, newSize)
        if (!hasSize(style)) update()
      }
      onLoad?.(ev)
    },
    onError: err => {
      // TODO: This is a trick
      // maybe fixed in next expo-image version
      if (!hasSize(size)) {
        uriToSize.set(uri, 'error')
        if (!hasSize(style)) update()
      }
      onError?.(err)
    },
    placeholder:
      store.get(colorSchemeAtom) === 'light'
        ? require('../assets/image-light-placeholder.png')
        : require('../assets/image-dark-placeholder.png'),
    style: tw.style(
      // Compute image size if style has no size
      !hasSize(style) && computeImageDispalySize(containerWidth, size),
      style as ViewStyle
    ),
  }

  if (isGif) {
    return (
      <ImageBackground {...imageProps}>
        <View
          style={tw`absolute left-2 top-2 rounded p-0.5 bg-black bg-opacity-50`}
        >
          <View style={tw`border-white border rounded px-1 py-0.5`}>
            <Text style={tw`text-white font-bold text-[10px]`}>GIF</Text>
          </View>
        </View>
      </ImageBackground>
    )
  }

  return <Image {...imageProps} />
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
        !hasSize(style) && computeImageDispalySize(containerWidth),
        `img-loading`,
        style
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

const Svg = ({
  uri,
  style,
  containerWidth,
  ...props
}: UriProps & { containerWidth?: number }) => {
  const { xml, size } = suspend(getSvgInfo, [uri!])
  const svgStyle = computeImageDispalySize(containerWidth, size)

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
}

async function comporessImage(uri: string) {
  try {
    await Image.prefetch(uri)
    const localURI = await Image.getCachePathAsync(uri)
    const staticImage = await ImageManipulator.manipulateAsync(
      localURI || uri,
      [],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    )
    return {
      uri: staticImage.uri,
      size: pick(staticImage, ['width', 'height']),
    }
  } catch (error) {
    return { uri }
  }
}

const Gif = (props: StyledImageProps) => {
  const sourceURI = isString(props.source)
    ? props.source
    : (props.source as any).uri
  const { uri, size } = suspend(comporessImage, [sourceURI!])
  if (!uriToSize.has(uri) && hasSize(size)) {
    uriToSize.set(uri, size)
  }

  return (
    <StyledImage
      {...props}
      isGif={sourceURI !== uri}
      source={{
        ...(isObject(props.source) && !isArray(props.source) && props.source),
        uri,
      }}
    />
  )
}

function computeImageDispalySize(
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
  const URI = isString(source)
    ? source
    : isObject(source) && !isArray(source) && isString(source.uri)
    ? source.uri
    : undefined
  const resolvedURI = URI ? resolveURL(URI) : undefined

  if (isString(resolvedURI) && isSvgURL(resolvedURI)) {
    return (
      <ErrorBoundary fallbackRender={() => null}>
        <Suspense fallback={imageLoadingRender(props)}>
          <Svg uri={resolvedURI} {...(props as any)} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  if (isString(resolvedURI) && isGifURL(resolvedURI) && !hasSize(props.style)) {
    return (
      <Suspense fallback={imageLoadingRender(props)}>
        <Gif
          {...props}
          source={{
            ...(isObject(source) && !isArray(source) && source),
            uri: resolvedURI,
          }}
        />
      </Suspense>
    )
  }

  return (
    <BasicImage
      {...props}
      source={{
        ...(isObject(source) && !isArray(source) && source),
        uri: resolvedURI,
      }}
    />
  )
}

export default StyledImage
