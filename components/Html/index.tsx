import { load } from 'cheerio'
import { Image } from 'expo-image'
import { useSetAtom } from 'jotai'
import { compact, findIndex, isString } from 'lodash-es'
import { memo, useMemo, useRef } from 'react'
import { Alert, LayoutRectangle, Image as RNImage, View } from 'react-native'
import RenderHtml, {
  RenderHTMLProps,
  defaultSystemFonts,
} from 'react-native-render-html'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { imageViewerAtom } from '@/jotai/imageViewerAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { resolveURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import { uriToSize } from '../StyledImage'
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

  const htmlLayoutRef = useRef<LayoutRectangle | undefined>()

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
                    const size = uriToSize.get(resolvedURI)

                    if (size === 'error') return false

                    let localURI = await Image.getCachePathAsync(resolvedURI)

                    if (localURI) {
                      localURI = RNImage.resolveAssetSource({
                        uri: localURI,
                      }).uri
                    }

                    return {
                      ...(hasSize(size) && size),
                      url: localURI || item.url,
                    }
                  })
                )
              ),
            })
          },
          onSelectText: () => {
            navigation.navigate('SelectableText', {
              html,
              htmlLayout: htmlLayoutRef.current,
            })
          },
          paddingX,
          selectOnly,
        }),
        [imageUrls, setImageViewer, paddingX, inModalScreen, html, selectOnly]
      )}
    >
      <View
        onLayout={ev => {
          htmlLayoutRef.current = ev.nativeEvent.layout
        }}
      >
        <RenderHtml
          systemFonts={systemFonts}
          baseStyle={tw`text-foreground ${getFontSize(5)}`}
          tagsStyles={{
            h1: tw`${getFontSize(
              3
            )} pb-1.5 border-b border-solid border-divider`,
            h2: tw`${getFontSize(
              4
            )} pb-1.5 border-b border-solid border-divider`,
            h3: tw`${getFontSize(4)}`,
            h4: tw`${getFontSize(4)}`,
            h5: tw`${getFontSize(5)}`,
            h6: tw`${getFontSize(6)}`,
            p: tw`${getFontSize(5)}`,
            a: tw`text-primary no-underline`,
            li: tw`text-justify`,
            hr: {
              backgroundColor: tw.color(`border-divider`),
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
      </View>
    </HtmlContext.Provider>
  )
}
