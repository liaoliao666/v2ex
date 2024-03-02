import { load } from 'cheerio'
import { Image } from 'expo-image'
import { useAtomValue, useSetAtom } from 'jotai'
import { compact, findIndex, isString } from 'lodash-es'
import { memo, useMemo } from 'react'
import { Alert, Platform, Image as RNImage } from 'react-native'
import RenderHtml, {
  RenderHTMLProps,
  defaultSystemFonts,
} from 'react-native-render-html'

import { imageViewerAtom } from '@/jotai/imageViewerAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { resolveURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import { uriInfo } from '../StyledImage'
import CodeRenderer from './CodeRenderer'
import { HtmlContext } from './HtmlContext'
import IFrameRenderer from './IFrameRenderer'
import ImageRenderer from './ImageRenderer'
import InputRenderer from './InputRenderer'
import TextRenderer from './TextRenderer'
import { getDefaultProps } from './helper'

const systemFonts = ['italic', ...defaultSystemFonts]

export default memo(
  Html,
  (prev: any, next: any) =>
    prev.source?.html! === next.source?.html &&
    prev.baseStyle?.color === next.baseStyle?.color
)

function Html({
  inModalScreen,
  paddingX = 32,
  selectOnly,
  ...renderHTMLProps
}: RenderHTMLProps & {
  inModalScreen?: boolean
  paddingX?: number
  selectOnly?: boolean
}) {
  const mergedProps = {
    ...getDefaultProps({ inModalScreen }),
    ...renderHTMLProps,
  }

  const html = (renderHTMLProps.source as any)?.html

  const setImageViewer = useSetAtom(imageViewerAtom)

  const imageUrls = useMemo(() => {
    if (!isString(html)) return []
    const $ = load(html)
    return $('img')
      .map((i, img) => ({
        url: $(img).attr('src')!,
      }))
      .get()
      .filter(item => !!item.url)
  }, [html])

  const screenWidth = useScreenWidth()

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <HtmlContext.Provider
      value={useMemo(
        () => ({
          onPreview: async url => {
            if (inModalScreen) {
              Alert.alert(
                '评论回复内暂不支持查看图片',
                '',
                [{ text: '确定' }],
                {
                  userInterfaceStyle: store.get(colorSchemeAtom),
                }
              )
              return
            }

            setImageViewer({
              index: findIndex(imageUrls, { url }),
              visible: true,
              imageUrls: compact(
                await Promise.all(
                  imageUrls.map(async item => {
                    const resolvedURI = resolveURL(item.url)
                    const size = uriInfo.get(resolvedURI)

                    if (size === 'error' || size === 'refetching') return false

                    let localUrl: string | null

                    if (Platform.OS === 'ios' || Platform.OS === 'macos') {
                      localUrl = await Image.getCachePathAsync(resolvedURI)

                      if (localUrl) {
                        localUrl = RNImage.resolveAssetSource({
                          uri: localUrl,
                        }).uri
                      }
                    }

                    return {
                      ...size,
                      url: localUrl! || resolvedURI,
                    }
                  })
                )
              ),
            })
          },
          onSelectText: () => {
            navigation.navigate('SelectableText', {
              html,
            })
          },
          paddingX,
          selectOnly,
        }),
        [imageUrls, setImageViewer, paddingX, inModalScreen, html, selectOnly]
      )}
    >
      <RenderHtml
        systemFonts={systemFonts}
        baseStyle={tw`text-[${colors.foreground}] ${fontSize.medium}`}
        tagsStyles={{
          h1: tw`${fontSize.xxlarge} pb-1.5 border-b border-solid border-[${colors.divider}]`,
          h2: tw`${fontSize.xlarge} pb-1.5 border-b border-solid border-[${colors.divider}]`,
          h3: tw`${fontSize.large}`,
          h4: tw`${fontSize.large}`,
          h5: tw`${fontSize.medium}`,
          h6: tw`${fontSize.small}`,
          p: tw`${fontSize.medium}`,
          a: tw`text-[${colors.primary}] no-underline`,
          li: tw`text-justify`,
          hr: {
            backgroundColor: colors.divider,
          },
          em: tw`italic`,
          ...mergedProps.tagsStyles,
        }}
        contentWidth={screenWidth - paddingX}
        {...mergedProps}
        renderers={{
          pre: CodeRenderer,
          img: ImageRenderer,
          iframe: IFrameRenderer,
          input: InputRenderer,
          _TEXT_: TextRenderer,
          ...mergedProps.renderers,
        }}
      />
    </HtmlContext.Provider>
  )
}
