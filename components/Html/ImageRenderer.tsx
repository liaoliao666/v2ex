import { CustomMixedRenderer, HTMLContentModel } from '@native-html/render'
import { isObject } from 'lodash-es'
import { useContext, useMemo, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { isSvgURL, resolveURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import StyledImage, { imageResults } from '../StyledImage'
import { BROKEN_IMAGE_SIZE } from '../StyledImage/helper'
import { HtmlContext } from './HtmlContext'

const ImageRenderer: CustomMixedRenderer = ({ tnode, style }) => {
  const { onPreview, paddingX } = useContext(HtmlContext)

  const url =
    (tnode as any).attributes?.src ||
    (tnode.domNode as any)?.attribs?.src ||
    undefined

  const screenWidth = useScreenWidth()
  const containerWidth = screenWidth - paddingX
  const resolvedURL = url ? resolveURL(url) : undefined
  const cachedResult = resolvedURL ? imageResults.get(resolvedURL) : undefined
  const [imageSize, setImageSize] = useState<
    { width: number; height: number } | undefined
  >(() => (isObject(cachedResult) ? cachedResult : undefined))
  const isLargeImage = useMemo(
    () => !!imageSize && (imageSize.width > 100 || imageSize.height > 100),
    [imageSize]
  )
  const isMiniImage =
    !!imageSize && imageSize.width < 50 && imageSize.height < 50
  const isMixedImage = tnode.contentModel === HTMLContentModel.mixed
  const nativeTextFlow = (tnode as any).styles?.nativeTextFlow
  const nativeStyle = StyleSheet.flatten(style as any) as {
    fontSize?: number
    lineHeight?: number
  }
  const fontSize = nativeTextFlow?.fontSize ?? nativeStyle?.fontSize
  const lineHeight =
    nativeTextFlow?.lineHeight || nativeStyle?.lineHeight || fontSize * 1.4
  const placeholderSize = isMixedImage
    ? typeof lineHeight === 'number' && lineHeight > 0
      ? lineHeight
      : BROKEN_IMAGE_SIZE
    : undefined
  const miniImageHeight = isMixedImage
    ? Math.max(
        typeof lineHeight === 'number' && lineHeight > 0 ? lineHeight * 0.8 : 0,
        typeof fontSize === 'number' && fontSize > 0 ? fontSize : 0
      ) || undefined
    : undefined
  const miniImageStyle =
    isMiniImage && miniImageHeight
      ? StyleSheet.flatten([
          style as any,
          {
            width: (miniImageHeight * imageSize.width) / imageSize.height,
            height: miniImageHeight,
          },
        ])
      : style
  const imageStyle = miniImageStyle

  const handleLoad = (event: any) => {
    const { width, height } = event?.source || {}
    if (typeof width === 'number' && typeof height === 'number') {
      setImageSize({ width, height })
    }
  }

  if (url && isSvgURL(url))
    return (
      <StyledImage
        style={imageStyle as any}
        source={url}
        containerWidth={containerWidth}
        placeholderSize={placeholderSize}
        onLoad={handleLoad}
      />
    )

  const image = (
    <StyledImage
      style={imageStyle as any}
      source={url}
      containerWidth={containerWidth}
      placeholderSize={placeholderSize}
      priority="low"
      autoplay={isMiniImage ? undefined : false}
      onLoad={handleLoad}
    />
  )

  if (isMiniImage) return image

  return (
    <Pressable
      onPress={() => {
        if (isLargeImage && url && typeof onPreview === 'function') {
          onPreview(url)
        }
      }}
    >
      {image}
    </Pressable>
  )
}

export default ImageRenderer
