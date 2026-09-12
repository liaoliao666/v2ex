import { CustomMixedRenderer } from '@native-html/render'
import { useContext } from 'react'
import { Pressable } from 'react-native'

import { isSvgURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import StyledImage from '../StyledImage'
import { HtmlContext } from './HtmlContext'

const ImageRenderer: CustomMixedRenderer = ({ tnode, style }) => {
  const { onPreview, paddingX } = useContext(HtmlContext)

  const url =
    (tnode as any).attributes?.src ||
    (tnode.domNode as any)?.attribs?.src ||
    undefined

  const screenWidth = useScreenWidth()
  const containerWidth = screenWidth - paddingX

  if (url && isSvgURL(url))
    return (
      <StyledImage
        style={style as any}
        source={url}
        containerWidth={containerWidth}
      />
    )

  return (
    <Pressable
      onPress={ev => {
        ev.stopPropagation()
        if (url) onPreview(url)
      }}
    >
      <StyledImage
        style={style as any}
        source={url}
        containerWidth={containerWidth}
        priority="low"
        autoplay={false}
      />
    </Pressable>
  )
}

export default ImageRenderer
