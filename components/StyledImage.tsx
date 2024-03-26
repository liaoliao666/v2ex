import { MaterialCommunityIcons } from '@expo/vector-icons'
import { parseToRgba } from 'color2k'
import { Image, ImageBackground, ImageProps, ImageSource } from 'expo-image'
import { useAtomValue } from 'jotai'
import {
  isArray,
  isEqual,
  isObject,
  isString,
  memoize,
  pick,
  uniqueId,
} from 'lodash-es'
import { memo, useEffect, useState } from 'react'
import {
  Pressable,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { Text } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { uiAtom } from '@/jotai/uiAtom'
import { k } from '@/servicies'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { genBMPUri, isGifURL, isSvgURL, resolveURL } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
}

type UriInfo = { width: number; height: number } | 'error' | 'refetching'

export const uriInfo = new Map<string | undefined, UriInfo>()
const MAX_IMAGE_HEIGHT = 510
const BROKEN_IMAGE_SIZE = 24

const genPlaceholder = memoize((color: string) => {
  const [r, g, b, a = 1] = parseToRgba(color)
  return genBMPUri(1, [b, g, r, parseInt(String(a * 255), 10)])
})

function BaseImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  ...props
}: StyledImageProps) {
  const { colors } = useAtomValue(uiAtom)
  const uri = (source as ImageSource).uri
  const size = uriInfo.get(uri)
  const update = useUpdate()

  if (!uri) return <View style={style} {...props} />

  if (size === 'error') {
    return (
      <BreakingImage
        onPress={() => {
          uriInfo.set(uri, 'refetching')
          update()
        }}
        style={style}
      />
    )
  }

  const imageProps: ImageProps = {
    ...props,
    source,
    onLoad: ev => {
      const newSize = pick(ev.source, ['width', 'height'])
      if (!isEqual(size, newSize)) {
        uriInfo.set(uri, newSize)
        if (!hasSize(style)) update()
      }
      onLoad?.(ev)
    },
    onError: err => {
      // TODO: This is a trick
      // Maybe fixed in next expo-image version
      if (!hasSize(size)) {
        uriInfo.set(uri, 'error')
        update()
      }
      onError?.(err)
    },
    placeholder: genPlaceholder(colors.neutral),
    placeholderContentFit: 'cover',
    style: tw.style(
      // Compute image size if style has no size
      !hasSize(style) && computeOptimalDispalySize(containerWidth, size),
      style as ViewStyle
    ),
  }

  if (!hasSize(style) && isGifURL(uri)) {
    return (
      <ImageBackground {...imageProps}>
        {!props.autoplay && size !== 'refetching' && <GifIcon />}
      </ImageBackground>
    )
  }

  return <Image {...imageProps} />
}

function GifIcon() {
  return (
    <View
      style={tw`absolute left-1 top-1 rounded p-0.5 bg-black bg-opacity-50`}
    >
      <View style={tw`border-white border rounded px-1 py-0.5`}>
        <Text style={tw`text-white font-bold text-[10px]`}>GIF</Text>
      </View>
    </View>
  )
}

function BreakingImage({
  onPress,
  style,
}: {
  onPress: () => void
  style: StyleProp<ViewStyle>
}) {
  const { colors } = useAtomValue(uiAtom)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[style, hasSize(style) && tw`items-center justify-center`]}
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
}

const uniqueGIfId = () => uniqueId(`Gif_`)
const gifListeners = new Set<() => void>()

let activeGifId = ''
export const setGifId = (nextGifId: string) => {
  if (activeGifId !== nextGifId) {
    activeGifId = nextGifId
    gifListeners.forEach(l => l())
  }
}

const Gif = (props: StyledImageProps) => {
  const [gifId] = useState(uniqueGIfId)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    const listener = () => {
      setAutoplay(gifId === activeGifId)
    }

    gifListeners.add(listener)
    return () => {
      gifListeners.delete(listener)
    }
  }, [gifId])

  return (
    <Pressable
      onPress={() => {
        setGifId(gifId)
      }}
      disabled={autoplay}
    >
      <BaseImage {...props} autoplay={autoplay} />
    </Pressable>
  )
}

const Svg = ({
  uri,
  style,
  containerWidth,
  ...props
}: UriProps & { containerWidth?: number }) => {
  const { colors } = useAtomValue(uiAtom)

  const svgQuery = k.other.svg.useQuery({
    variables: uri!,
  })

  if (svgQuery.isPending) {
    return (
      <View
        style={tw.style(
          !hasSize(style) &&
            computeOptimalDispalySize(
              containerWidth,
              svgQuery.errorUpdateCount ? 'refetching' : undefined
            ),
          `bg-[${colors.neutral}]`,
          style as any
        )}
      />
    )
  }

  if (!svgQuery.data) {
    return <BreakingImage style={style} onPress={svgQuery.refetch} />
  }

  const { xml, size } = svgQuery.data

  return (
    <SvgXml
      {...props}
      xml={xml}
      style={tw.style(
        computeOptimalDispalySize(containerWidth, size),
        style as any
      )}
      width="100%"
    />
  )
}

function computeOptimalDispalySize(
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
  if (!size) {
    return {
      aspectRatio: 1,
      width: containerWidth
        ? Math.min(MAX_IMAGE_HEIGHT, containerWidth)
        : `100%`,
    }
  }

  const { width, height } = size

  // Display mini image
  if (width <= 200 && height <= 200) {
    return size
  }

  const aspectRatio = width / height

  // Display auto fit image
  if (!containerWidth) {
    return {
      aspectRatio,
      width: `100%`,
    }
  }

  // Display small image
  if (
    width <= Math.min(MAX_IMAGE_HEIGHT, containerWidth) &&
    height <= MAX_IMAGE_HEIGHT
  ) {
    return size
  }

  // Display optimal size
  const actualWidth = Math.min(aspectRatio * MAX_IMAGE_HEIGHT, containerWidth)
  return actualWidth === containerWidth
    ? {
        aspectRatio,
        width: `100%`,
      }
    : {
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
    return <Svg uri={resolvedURI} {...(props as any)} />
  }

  if (
    isString(resolvedURI) &&
    isGifURL(resolvedURI) &&
    !hasSize(props.style) &&
    !props.autoplay
  ) {
    return (
      <Gif
        {...props}
        source={{
          ...(isObject(source) && !isArray(source) && source),
          uri: resolvedURI,
        }}
      />
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

export default memo(StyledImage)
