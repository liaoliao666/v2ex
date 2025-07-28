import { ImageSource } from 'expo-image'
import { isArray, isObject, isString } from 'lodash-es'
import { memo } from 'react'

import { isSvgURL, resolveURL } from '@/utils/url'

import { BaseImageProps as StyledImageProps } from './BaseImage'
import { BaseImage } from './BaseImage'
import Svg from './Svg'
import { imageResults } from './helper'

export { StyledImageProps, imageResults }

function StyledImage({ source, ...props }: StyledImageProps) {
  const URI = isString(source)
    ? source
    : isImageSource(source)
    ? source.uri
    : undefined
  const resolvedURI = URI ? resolveURL(URI) : undefined

  if (isString(resolvedURI) && isSvgURL(resolvedURI)) {
    return <Svg uri={resolvedURI} {...(props as any)} />
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

function isImageSource(source: any): source is ImageSource {
  return isObject(source) && !isArray(source) && isString((source as any).uri)
}

export default StyledImage
