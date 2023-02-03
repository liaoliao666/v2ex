import { load } from 'cheerio'
import { useContext, useMemo, useState } from 'react'
import { LayoutRectangle, Pressable } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'

import StyledImage from '../StyledImage'
import { HtmlContext } from './HtmlContext'

const ImageRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { onPreview } = useContext(HtmlContext)

  const url = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    return $('img').attr('src')
  }, [tnode.domNode])

  const [layout, setLayout] = useState<LayoutRectangle>()

  return (
    <Pressable
      onPress={ev => {
        ev.stopPropagation()
        if (url) onPreview(url)
      }}
      style={layout}
    >
      <StyledImage
        style={style as any}
        source={{ uri: url }}
        onLayout={ev => {
          setLayout(ev.nativeEvent.layout)
        }}
      />
    </Pressable>
  )
}

export default ImageRenderer
