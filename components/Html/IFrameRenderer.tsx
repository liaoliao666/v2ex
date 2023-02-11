import { load } from 'cheerio'
import { useContext, useMemo } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'
import YoutubePlayer from 'react-native-youtube-iframe'

import tw from '@/utils/tw'

import { HtmlContext } from './HtmlContext'

const aspectRatio = 1.778523489932886

const IFrameRenderer: CustomBlockRenderer = ({ tnode }) => {
  const { paddingX } = useContext(HtmlContext)

  const videoId = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const src = $('iframe').attr('src')
    return src?.includes('www.youtube.com') ? src.match(/\/(\w+)$/)?.[1] : ''
  }, [tnode.domNode])

  const layout = useWindowDimensions()

  if (!videoId) return null

  const witdh = layout.width - paddingX
  const height = witdh / aspectRatio

  return (
    <View style={tw`bg-black`}>
      <YoutubePlayer width={witdh} height={height} videoId={videoId} />
    </View>
  )
}

export default IFrameRenderer
