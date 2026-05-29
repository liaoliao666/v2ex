import { Image } from 'expo-image'
import { useAtomValue, useSetAtom } from 'jotai'
import { compact, findIndex, isString, pick } from 'lodash-es'
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
import tw from '@/utils/tw'
import { isSvgURL, resolveURL } from '@/utils/url'
import { useScreenWidth } from '@/utils/useScreenWidth'

import { imageResults } from '../StyledImage'
import CodeRenderer from './CodeRenderer'
import { HtmlContext } from './HtmlContext'
import IFrameRenderer from './IFrameRenderer'
import ImageRenderer from './ImageRenderer'
import InputRenderer from './InputRenderer'
import TextRenderer from './TextRenderer'
import { getDefaultProps } from './helper'

const systemFonts = ['italic', ...defaultSystemFonts]
const IMG_TAG_PATTERN = /<img[\s/>]/i
const IMG_SRC_PATTERN = /<img\b[^>]*?\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi

export default memo(
  Html,
  (prev: any, next: any) =>
    prev.source?.html! === next.source?.html &&
    prev.baseStyle?.color === next.baseStyle?.color &&
    prev.paddingX === next.paddingX &&
    prev.inModalScreen === next.inModalScreen &&
    (prev.selectable ?? true) === (next.selectable ?? true)
)

function Html({
  inModalScreen,
  paddingX = 32,
  selectable = true,
  ...renderHTMLProps
}: RenderHTMLProps & {
  inModalScreen?: boolean
  paddingX?: number
  selectable?: boolean
}) {
  const defaultProps = getDefaultProps({ inModalScreen, selectable })
  const mergedProps = {
    ...defaultProps,
    ...renderHTMLProps,
    defaultTextProps: {
      ...defaultProps.defaultTextProps,
      ...renderHTMLProps.defaultTextProps,
    },
  }

  const setImageViewer = useSetAtom(imageViewerAtom)
  const sourceHtml = (renderHTMLProps.source as any)?.html

  const imageUrls = useMemo(() => {
    const html = sourceHtml

    if (!isString(html) || !IMG_TAG_PATTERN.test(html)) return []

    IMG_SRC_PATTERN.lastIndex = 0

    const urls: { url: string }[] = []
    let match = IMG_SRC_PATTERN.exec(html)

    while (match) {
      const url = match[1] || match[2] || match[3]
      if (url) urls.push({ url })
      match = IMG_SRC_PATTERN.exec(html)
    }

    return urls
  }, [sourceHtml])

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

            const urls = compact(
              await Promise.all(
                imageUrls.map(async item => {
                  const resolvedURI = resolveURL(item.url)
                  const imageResult = imageResults.get(resolvedURI)

                  if (
                    imageResult === 'error' ||
                    imageResult === 'refetching' ||
                    isSvgURL(resolvedURI)
                  )
                    return false

                  let localUrl: string | null = null

                  if (Platform.OS === 'ios' || Platform.OS === 'macos') {
                    localUrl = await Image.getCachePathAsync(resolvedURI)

                    if (localUrl) {
                      localUrl = RNImage.resolveAssetSource({
                        uri: localUrl,
                      }).uri
                    }
                  }

                  return {
                    ...pick(imageResult, ['width', 'height']),
                    url: localUrl! || resolvedURI,
                  }
                })
              )
            )

            setImageViewer({
              index: findIndex(imageUrls, { url }),
              visible: true,
              imageUrls: urls,
            })
          },
          paddingX,
          selectable,
        }),
        [imageUrls, setImageViewer, paddingX, inModalScreen, selectable]
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
          hr: {
            backgroundColor: colors.divider,
          },
          em: tw`italic`,
          ...mergedProps.tagsStyles,
        }}
        contentWidth={screenWidth - paddingX}
        {...mergedProps}
        renderers={{
          a: TextRenderer,
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
