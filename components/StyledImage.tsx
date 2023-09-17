import { isArray, isObject, isString, pick } from 'lodash-es'
import { useQuery } from 'quaere'
import { useState } from 'react'
import {
  Image,
  ImageProps,
  LayoutRectangle,
  View,
  ViewStyle,
} from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { svgQuery } from '@/servicies/other'
import { hasSize } from '@/utils/hasSize'
import { isExpoGo } from '@/utils/isExpoGo'
import { isStyle } from '@/utils/isStyle'
import tw from '@/utils/tw'
import { isSvgURL, resolveURL } from '@/utils/url'

const uriToSize = new Map()

let FastImage = Image
if (!isExpoGo) {
  FastImage = require('react-native-fast-image')
}

function CustomImage({ style, source, onLoad, onError, ...props }: ImageProps) {
  const uri =
    isObject(source) && !isArray(source) && isString(source.uri)
      ? resolveURL(source.uri)
      : undefined

  const [isLoading, setIsLoading] = useState(uri ? !uriToSize.has(uri) : false)

  const [size, setSize] = useState<LayoutRectangle>(uriToSize.get(uri))

  const hasPassedSize = isStyle(style) && hasSize(style)

  const isMiniImage =
    isStyle(size) && hasSize(size)
      ? size.width < 100 && size.height < 100
      : false

  return (
    <FastImage
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
        const newSize: any = pick(
          FastImage === Image ? ev.nativeEvent.source : ev.nativeEvent,
          ['width', 'height']
        )

        uriToSize.set(uri, newSize)
        setSize(prev => {
          if (
            prev?.width === newSize.width &&
            prev?.height === newSize.height
          ) {
            return prev
          }

          return newSize
        })

        setIsLoading(false)
        onLoad?.(ev)
      }}
      onError={err => {
        uriToSize.set(uri, undefined)
        setIsLoading(false)
        onError?.(err)
      }}
      style={tw.style(
        !hasPassedSize &&
          (isMiniImage
            ? size
            : {
                aspectRatio: size ? size.width / size.height : 1,
                width: `100%`,
              }),
        !hasPassedSize && uriToSize.has(uri) && !uriToSize.get(uri) && `hidden`,
        style as ViewStyle,
        isLoading && `img-loading`
      )}
      resizeMode={'stretch'}
    />
  )
}

function CustomSvgUri({ uri, style, ...props }: UriProps) {
  const { data: svg, error } = useQuery({
    query: svgQuery,
    enabled: !!uri,
  })

  if (error) return null

  if (!svg?.xml) {
    return (
      <View
        style={
          isStyle(style) && hasSize(style)
            ? tw.style(style, `img-loading`)
            : tw.style(`img-loading`, 'aspect-square')
        }
      />
    )
  }

  return (
    <SvgXml
      {...props}
      xml={svg.xml}
      style={
        (isArray(style)
          ? [svg.wraperStyle, ...style]
          : {
              ...svg.wraperStyle,
              ...(isStyle(style) ? style : {}),
            }) as any
      }
      width="100%"
    />
  )
}

export default function StyledImage({ source, ...props }: ImageProps) {
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
