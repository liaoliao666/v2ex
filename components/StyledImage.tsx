import { useQuery } from '@tanstack/react-query'
import { load } from 'cheerio'
import { isArray, isObject, isString } from 'lodash-es'
import { useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { hasSize } from '@/utils/hasSize'
import { isStyle } from '@/utils/isStyle'
import { request } from '@/utils/request'
import tw from '@/utils/tw'
import { isSvgUrl, resolveUrl } from '@/utils/url'

const placeholderCls = 'bg-[rgb(185,202,211)] dark:bg-[rgb(62,65,68)]'
const uriToSize = new Map()

let FastImage = Image

try {
  FastImage = require('react-native-fast-images')
} catch {
  FastImage = Image
}

function CustomImage({ style, source, onLoad, onError, ...props }: ImageProps) {
  const uri =
    isObject(source) && !isArray(source) && isString(source.uri)
      ? resolveUrl(source.uri)
      : undefined

  const [isLoading, setIsLoading] = useState(uri ? !uriToSize.has(uri) : false)

  const [size, setSize] = useState<{
    width: number
    height: number
  }>(uriToSize.get(uri))

  const imageProps: ImageProps = {
    ...props,
    source: isObject(source)
      ? {
          ...source,
          uri,
        }
      : source,
    onLoad: ev => {
      const newSize: any = ev.nativeEvent

      if (!uriToSize.has(uri) && hasSize(newSize)) {
        uriToSize.set(uri, newSize)
        setSize(newSize)
      }

      setIsLoading(false)
      onLoad?.(ev)
    },
    onError(err) {
      if (!uriToSize.has(uri)) {
        setIsLoading(false)
      }
      onError?.(err)
      uriToSize.set(uri, undefined)
    },
  }

  return isStyle(style) && hasSize(style) ? (
    <FastImage
      {...imageProps}
      style={isLoading ? tw.style(style, placeholderCls) : style}
    />
  ) : (
    <View
      style={{
        aspectRatio: size ? size.width / size.height : 1,
        display: uriToSize.has(uri) && !uriToSize.get(uri) ? 'none' : 'flex',
      }}
    >
      <FastImage
        {...imageProps}
        style={tw.style(
          style as ViewStyle,
          `w-full h-full`,
          isLoading && placeholderCls
        )}
      />
    </View>
  )
}

function CustomSvgUri({ uri, style, ...props }: UriProps) {
  const { data: svg } = useQuery(
    [uri],
    async () => {
      const { data: xml } = await request.get<string>(uri!)
      const $ = load(xml)
      const $svg = $('svg')
      const width = parseFloat($svg.attr('width') as string)
      const height = parseFloat($svg.attr('height') as string)

      return {
        xml,
        wraperStyle: { aspectRatio: width / height },
      }
    },
    { enabled: !!uri, staleTime: Infinity }
  )

  if (!svg?.xml) {
    return (
      <View
        style={
          isStyle(style) && hasSize(style)
            ? tw.style(style, placeholderCls)
            : tw.style(placeholderCls, 'aspect-square')
        }
      />
    )
  }

  return isStyle(style) && hasSize(style) ? (
    <SvgXml {...props} xml={svg.xml} style={style} />
  ) : (
    <View style={svg.wraperStyle}>
      <SvgXml
        {...props}
        xml={svg.xml}
        width="100%"
        height="100%"
        style={style}
      />
    </View>
  )
}

export default function StyledImage({ source, ...props }: ImageProps) {
  if (
    isObject(source) &&
    !isArray(source) &&
    isString(source.uri) &&
    isSvgUrl(source.uri)
  ) {
    return <CustomSvgUri uri={source.uri} {...(props as any)} />
  }

  return <CustomImage source={source} {...props} />
}
