import { load } from 'cheerio'
import { useContext, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'
import YoutubePlayer from 'react-native-youtube-iframe'

import { HtmlContext } from './HtmlContext'

const aspectRatio = 1.778523489932886

const IFrameRenderer: CustomBlockRenderer = ({ tnode }) => {
  const { youtubePaddingX = 32 } = useContext(HtmlContext)

  const videoId = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const src = $('iframe').attr('src')
    return src?.includes('www.youtube.com') ? src.match(/\/(\w+)$/)?.[1] : ''
  }, [tnode.domNode])

  const layout = useWindowDimensions()

  if (!videoId) return null

  const witdh = layout.width - youtubePaddingX
  const height = witdh / aspectRatio

  return <YoutubePlayer width={witdh} height={height} videoId={videoId} />
}

export default IFrameRenderer
