import { isArray, isObject, isString } from 'lodash-es'
import { memo } from 'react'
import { StyleProp, ImageStyle, ImageURISource } from 'react-native'

import { isSvgURL, resolveURL } from '@/utils/url'

import { BaseImageProps } from './BaseImage'
import { BaseImage } from './BaseImage'
import Svg, { SvgProps } from './Svg'
import { imageResults } from './helper'

export type StyledImageProps = Omit<BaseImageProps, 'source'> & {
  source?: string | ImageURISource
}

export { imageResults }

export default memo(function StyledImage(props: StyledImageProps) {
  const { source, style, ...rest } = props
  
  if (!source) return null

  if (isString(source)) {
    const uri = resolveURL(source)
    if (isSvgURL(uri)) {
      return <Svg uri={uri} style={style as any} />
    }
    return <BaseImage {...rest} source={{ uri }} style={style} />
  }

  if (isArray(source)) {
    const [firstSource] = source
    if (!firstSource) return null

    if (isString(firstSource)) {
      const uri = resolveURL(firstSource)
      if (isSvgURL(uri)) {
        return <Svg uri={uri} style={style as any} />
      }
      return <BaseImage {...rest} source={{ uri }} style={style} />
    }

    if (isObject(firstSource) && 'uri' in firstSource && typeof firstSource.uri === 'string') {
      const uri = resolveURL(firstSource.uri)
      if (isSvgURL(uri)) {
        return <Svg uri={uri} style={style as any} />
      }
      return <BaseImage {...rest} source={{ uri }} style={style} />
    }
  }

  if (isObject(source) && 'uri' in source && typeof source.uri === 'string') {
    const uri = resolveURL(source.uri)
    if (isSvgURL(uri)) {
      return <Svg uri={uri} style={style as any} />
    }
    return <BaseImage {...rest} source={{ uri }} style={style} />
  }

  return null
})
