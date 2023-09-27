import { Image, ImageProps } from 'expo-image'
import {
  isArray,
  isEqual,
  isObject,
  isPlainObject,
  isString,
  pick,
} from 'lodash-es'
import { useQuery } from 'quaere'
import { useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { svgQuery } from '@/servicies/other'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { isSvgURL, resolveURL } from '@/utils/url'

export interface StyledImageProps extends ImageProps {
  containerWidth?: number
}

type Size = { width: number; height: number }

const uriToSize = new Map<string | undefined, Size | 'error'>()

const MAX_IMAGE_HEIGHT = 510

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

  const [size, setSize] = useState(uriToSize.get(uri))

  const computeImageSize = (): ViewStyle => {
    // 如果图片加载失败，不显示
    if (size === 'error') {
      return {
        width: 0,
        height: 0,
      }
    }

    // 如果加载中，显示占位图
    if (!hasSize(size)) {
      return tw.style(
        {
          aspectRatio: 1,
          width: containerWidth
            ? Math.min(containerWidth, MAX_IMAGE_HEIGHT)
            : `100%`,
        },
        'img-loading'
      )
    }

    const isMiniImage = size.width < 100 && size.height < 100

    // 如果是小图，直接显示
    if (isMiniImage) {
      return size
    }

    // 如果是大图，限制高度
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
        setSize(prev => (isEqual(prev, newSize) ? prev : newSize))
        onLoad?.(ev)
      }}
      onError={err => {
        // TODO: This is a trick, maybe fixed in next expo-image version
        if (!hasSize(size)) {
          setSize('error')
          onError?.(err)
        }
      }}
      style={tw.style(computeImageSize(), style as ViewStyle)}
    />
  )
}

function CustomSvgUri({ uri, style, ...props }: UriProps) {
  const { data: svg, error } = useQuery({
    query: svgQuery,
    variables: { url: uri! },
    enabled: !!uri,
  })

  if (error) return null

  if (!svg?.xml) {
    return (
      <View
        style={
          hasSize(style)
            ? tw.style(style, `img-loading`)
            : tw.style(`img-loading`, 'aspect-square')
        }
      />
    )
  }

  const svgStyle = {
    aspectRatio: svg.width / svg.height || 1,
    width: '100%',
  }

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

export default function StyledImage({ source, ...props }: StyledImageProps) {
  if (
    isObject(source) &&
    !isArray(source) &&
    isString(source.uri) &&
    isSvgURL(source.uri)
  ) {
    return <CustomSvgUri uri={source.uri} {...(props as any)} />
  }

  return <CustomImage source={source} {...props} />
}
