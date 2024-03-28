import { MaterialCommunityIcons } from '@expo/vector-icons'
import { parseToRgba } from 'color2k'
import { Image, ImageBackground, ImageProps, ImageSource } from 'expo-image'
import { useAtomValue } from 'jotai'
import { isArray, isEqual, isObject, isString, memoize, pick } from 'lodash-es'
import { memo, useEffect } from 'react'
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
import { genBMPUri, isSvgURL, resolveURL } from '@/utils/url'
import useLatest from '@/utils/useLatest'
import useUpdate from '@/utils/useUpdate'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
}

type ImageResult =
  | { width: number; height: number; isAnimated?: boolean }
  | 'error'
  | 'refetching'

export const imageResults = new Map<string | undefined, ImageResult>()
const MAX_IMAGE_HEIGHT = 510
const BROKEN_IMAGE_SIZE = 24
const genPlaceholder = memoize((color: string) => {
  const [r, g, b, a = 1] = parseToRgba(color)
  return genBMPUri(1, [b, g, r, parseInt(String(a * 255), 10)])
})

function ImageImpl({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  ...props
}: StyledImageProps) {
  const { colors } = useAtomValue(uiAtom)
  const uri = (source as ImageSource).uri
  const result = imageResults.get(uri)
  const update = useUpdate()
  const hasPassedSize = hasSize(style)

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

const animatedImageListeners = new Set<() => void>()
let animatingImage = ''
function isAnimatingImage(uri: string) {
  return uri === animatingImage
}
export function setAnimatingImage(nextAnimatedImage: string) {
  if (!isAnimatingImage(nextAnimatedImage)) {
    animatingImage = nextAnimatedImage
    animatedImageListeners.forEach(l => l())
  }
}

function AnimatedImageOverlay({
  update,
  isAnimating,
  uri,
}: {
  isAnimating: boolean
  update: () => void
  uri: string
}) {
  const isAnimatingRef = useLatest(isAnimating)

  useEffect(() => {
    const listener = () => {
      if (isAnimatingImage(uri) !== isAnimatingRef.current) {
        update()
      }
    }

    animatedImageListeners.add(listener)
    return () => {
      animatedImageListeners.delete(listener)

      if (!animatedImageListeners.size) {
        animatingImage = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri])

  return (
    <Pressable
      style={tw`absolute inset-0`}
      onPress={() => {
        setAnimatingImage(uri)
      }}
      disabled={isAnimating}
    >
      {!isAnimating && (
        <View
          style={tw`absolute left-1 top-1 rounded p-0.5 bg-black bg-opacity-50`}
        >
          <View style={tw`border-white border rounded px-1 py-0.5`}>
            <Text style={tw`text-white font-bold text-[10px]`}>GIF</Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}

function BrokenImage({
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

function Svg({
  uri,
  style,
  containerWidth,
  ...props
}: UriProps & { containerWidth?: number }) {
  const { colors } = useAtomValue(uiAtom)
  const hasPassedSize = hasSize(style)

  const svgQuery = k.other.svgXml.useQuery({
    variables: uri!,
  })

  if (svgQuery.isPending) {
    return (
      <View
        style={tw.style(
          !hasPassedSize &&
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
    return <BrokenImage style={style} onPress={svgQuery.refetch} />
  }

  return (
    <SvgXml
      {...props}
      xml={svgQuery.data.xml}
      style={tw.style(
        !hasPassedSize &&
          computeOptimalDispalySize(containerWidth, svgQuery.data),
        style as any
      )}
      width="100%"
    />
  )
}

function computeOptimalDispalySize(
  containerWidth?: number,
  size?: ImageResult
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
    return { width, height }
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
    return { width, height }
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

  return (
    <ImageImpl
      {...props}
      source={{
        ...(isObject(source) && !isArray(source) && source),
        uri: resolvedURI,
      }}
    />
  )
}

export default memo(StyledImage)
