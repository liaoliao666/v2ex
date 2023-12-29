import { load } from 'cheerio'
import { isObjectLike } from 'lodash-es'
import { useContext, useMemo } from 'react'
import { Pressable } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'

import { isSvgURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import StyledImage from '../StyledImage'
import { HtmlContext } from './HtmlContext'

const ImageRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { onPreview, paddingX } = useContext(HtmlContext)

  const url = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    return $('img').attr('src')
  }, [tnode.domNode])

  const screenWidth = useScreenWidth()
  const containerWidth = isPlainContainer(tnode)
    ? screenWidth - paddingX
    : undefined

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
      />
    </Pressable>
  )
}

const plainContainers = ['html', 'body', 'div', 'a', 'p', 'img']

function isPlainContainer(tnode: any, lever = 0): boolean {
  if (!isObjectLike(tnode) || lever >= 3) return true
  if (!plainContainers.includes(tnode.tagName)) return false
  return isPlainContainer(tnode.parent, lever + 1)
}

export default ImageRenderer
