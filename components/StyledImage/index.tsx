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
    : isObject(source) && !isArray(source) && isString(source.uri)
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

export default memo(StyledImage)
