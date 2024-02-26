import { MaterialCommunityIcons } from '@expo/vector-icons'
import { load } from 'cheerio'
import { toRgba } from 'color2k'
import { Image, ImageBackground, ImageProps } from 'expo-image'
import * as ImageManipulator from 'expo-image-manipulator'
import { useAtomValue } from 'jotai'
import {
  isArray,
  isEqual,
  isObject,
  isPlainObject,
  isString,
  memoize,
  pick,
} from 'lodash-es'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { TouchableOpacity, View, ViewStyle } from 'react-native'
import { Text } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'
import { suspend } from 'suspend-react'

import { getUI, uiAtom } from '@/jotai/uiAtom'
import { hasSize } from '@/utils/hasSize'
import { request } from '@/utils/request'
import tw from '@/utils/tw'
import { genBMPUri, isGifURL, isSvgURL, resolveURL } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
  showGifIcon?: boolean
}

type UriInfo = { width: number; height: number } | 'error' | 'refetching'

export const uriInfo = new Map<string | undefined, UriInfo>()
const MAX_IMAGE_HEIGHT = 510
const BROKEN_IMAGE_SIZE = 24

const genPlaceholder = memoize((color: string) => {
  const [r, g, b, a = 1] = toRgba(color)
    .replace(/^(rgb|rgba)\(/, '')
    .replace(/\)$/, '')
    .replace(/\s/g, '')
    .split(',')
    .map(Number)
  const rgba = [b, g, r, parseInt(String(a * 255), 10)]
  return genBMPUri(1, rgba)
})

function BaseImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  showGifIcon,
  ...props
}: StyledImageProps) {
  const { colors } = useAtomValue(uiAtom)
  const uri = isObject(source) && !isArray(source) ? source.uri : undefined
  const size = uriInfo.get(uri)
  const update = useUpdate()
  const imageProps: ImageProps = {
    ...props,
    source,
    onLoad: ev => {
      const newSize: any = pick(ev.source, ['width', 'height'])
      if (!isEqual(size, newSize)) {
        uriInfo.set(uri, newSize)
        if (!hasSize(style)) update()
      }
      onLoad?.(ev)
    },
    onError: err => {
      // TODO: This is a trick
      // maybe fixed in next expo-image version
      if (!hasSize(size)) {
        uriInfo.set(uri, 'error')
        if (!hasSize(style)) update()
      }
      onError?.(err)
    },
    placeholder: genPlaceholder(colors.neutral),
    placeholderContentFit: 'cover',
    style: tw.style(
      // Compute image size if style has no size
      !hasSize(style) && computeImageDispalySize(containerWidth, size),
      style as ViewStyle
    ),
  }

  if (size === 'error')
    return (
      <TouchableOpacity
        onPress={() => {
          uriInfo.set(uri, 'refetching')
          update()
        }}
        style={hasSize(style) && [style, tw`items-center justify-center`]}
      >
        <MaterialCommunityIcons
          name="image-off-outline"
          size={
            hasSize(style) &&
            isFinite(style.width) &&
            style.width < BROKEN_IMAGE_SIZE
              ? style.width
              : BROKEN_IMAGE_SIZE
          }
          color={colors.default}
        />
      </TouchableOpacity>
    )

  if (showGifIcon) {
    return (
      <ImageBackground {...imageProps}>
        <View
          style={tw`absolute left-1 top-1 rounded p-0.5 bg-black bg-opacity-50`}
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
        `bg-[${getUI().colors.neutral}]`,
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
  if (!uriInfo.has(uri) && hasSize(size)) {
    uriInfo.set(uri, size)
  }

  return (
    <StyledImage
      {...props}
      showGifIcon={sourceURI !== uri}
      source={{
        ...(isObject(props.source) && !isArray(props.source) && props.source),
        uri,
      }}
    />
  )
}

function computeImageDispalySize(
  containerWidth?: number,
  size?: UriInfo
): ViewStyle {
  if (size === 'refetching' || size === 'error') {
    return {
      width: BROKEN_IMAGE_SIZE,
      height: BROKEN_IMAGE_SIZE,
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
    <BaseImage
      {...props}
      source={{
        ...(isObject(source) && !isArray(source) && source),
        uri: resolvedURI,
      }}
    />
  )
}

export default StyledImage
