import { load } from 'cheerio'
import { useContext, useMemo } from 'react'
import { View } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'
import YoutubePlayer, { YoutubeIframeProps } from 'react-native-youtube-iframe'

import tw from '@/utils/tw'
import { useScreenWidth } from '@/utils/useScreenWidth'

import { HtmlContext } from './HtmlContext'

const aspectRatio = 1.778523489932886

const webViewProps: YoutubeIframeProps['webViewProps'] = {
  androidLayerType: 'software',
}

const IFrameRenderer: CustomBlockRenderer = ({ tnode }) => {
  const { paddingX } = useContext(HtmlContext)
  const width = useScreenWidth() - paddingX
  const height = width / aspectRatio

  const videoId = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const src = $('iframe').attr('src')
    return src?.includes('www.youtube.com')
      ? src.match(/\/(\w+)$/)?.[1]
      : undefined
  }, [tnode.domNode])

  if (!videoId) return null

  return (
    <View style={tw`bg-black`}>
      <YoutubePlayer
        width={width}
        height={height}
        videoId={videoId}
        webViewProps={webViewProps}
      />
    </View>
  )
}

export default IFrameRenderer
