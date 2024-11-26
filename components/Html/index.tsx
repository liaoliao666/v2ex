import { load } from 'cheerio'
import { useAtomValue } from 'jotai'
import { isString } from 'lodash-es'
import { memo, useMemo } from 'react'
import RenderHtml, {
  RenderHTMLProps,
  defaultSystemFonts,
} from 'react-native-render-html'

import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { useScreenWidth } from '@/utils/useScreenWidth'

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
          onSelectText: () => {
            navigation.navigate('SelectableText', {
              html,
            })
          },
          paddingX,
          selectOnly,
        }),
        [imageUrls, paddingX, inModalScreen, html, selectOnly]
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
