import { useQuery } from '@tanstack/react-query'
import { load } from 'cheerio'
import { isArray, isObject, isString } from 'lodash-es'
import { useState } from 'react'
import {
  Image,
  ImageProps,
  LayoutRectangle,
  View,
  ViewStyle,
} from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { hasSize } from '@/utils/hasSize'
import { isExpoGo } from '@/utils/isExpoGo'
import { isStyle } from '@/utils/isStyle'
import { request } from '@/utils/request'
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
    isStyle(size) && hasSize(size) ? size.width < 50 && size.height < 50 : false

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
        const newSize: any =
          FastImage === Image ? ev.nativeEvent.source : ev.nativeEvent

        if (!uriToSize.has(uri) && hasSize(newSize)) {
          uriToSize.set(uri, newSize)
          setSize(newSize)
        }

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
        isLoading && `bg-loading`
      )}
      resizeMode={'stretch'}
    />
  )
}

function CustomSvgUri({ uri, style, ...props }: UriProps) {
  const { data: svg, isError } = useQuery(
    [uri],
    async () => {
      const { data: xml } = await request.get<string>(uri!)
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
        wraperStyle: { aspectRatio: width / height || 1, width: '100%' },
      }
    },
    { enabled: !!uri, staleTime: Infinity, cacheTime: 1000 * 60 * 10 }
  )

  if (isError) return null

  if (!svg?.xml) {
    return (
      <View
        style={
          isStyle(style) && hasSize(style)
            ? tw.style(style, `bg-loading`)
            : tw.style(`bg-loading`, 'aspect-square')
        }
      />
    )
  }

  return (
    <SvgXml
      {...props}
      xml={svg.xml}
      style={
        isArray(style)
          ? [svg.wraperStyle, ...style]
          : {
              ...svg.wraperStyle,
              ...(isStyle(style) ? style : {}),
            }
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
