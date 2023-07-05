import { load } from 'cheerio'
import { useContext, useMemo } from 'react'
import { Pressable } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'

import { isSvgURL } from '@/utils/url'

import StyledImage from '../StyledImage'
import { HtmlContext } from './HtmlContext'

const ImageRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { onPreview } = useContext(HtmlContext)

  const url = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    return $('img').attr('src')
  }, [tnode.domNode])

  if (url && isSvgURL(url))
    return <StyledImage style={style as any} source={{ uri: url }} />

  return (
    <Pressable
      onPress={ev => {
        ev.stopPropagation()
        if (url) onPreview(url)
      }}
    >
      <StyledImage style={style as any} source={{ uri: url }} />
    </Pressable>
  )
}

export default ImageRenderer
