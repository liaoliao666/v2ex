import { CustomMixedRenderer } from '@native-html/render'
import { isObject } from 'lodash-es'
import { useContext, useMemo, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'

import { isSvgURL, resolveURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import StyledImage, { imageResults } from '../StyledImage'
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
    !!imageSize && imageSize.width <= 100 && imageSize.height <= 100
  const previousSibling = (tnode as any).parent?.children?.[
    (tnode as any).nodeIndex - 1
  ]
  const hasContentBefore = !!previousSibling
  const previousSiblingIsImage =
    previousSibling?.tagName === 'img' ||
    previousSibling?.domNode?.name === 'img'
  const imageStyle =
    hasContentBefore && !previousSiblingIsImage
      ? StyleSheet.flatten([style as any, { marginTop: 8 }])
      : style

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
        onLoad={handleLoad}
      />
    )

  const image = (
    <StyledImage
      style={imageStyle as any}
      source={url}
      containerWidth={containerWidth}
      priority="low"
      autoplay={false}
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
