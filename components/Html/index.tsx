import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { load } from 'cheerio'
import { useSetAtom } from 'jotai'
import { findIndex, first, isArray, isString } from 'lodash-es'
import { memo, useMemo } from 'react'
import { Alert, useWindowDimensions } from 'react-native'
import RenderHtml, {
  HTMLContentModel,
  HTMLElementModel,
  RenderHTMLProps,
} from 'react-native-render-html'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { imageViewerAtom } from '@/jotai/imageViewerAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { RootStackParamList } from '@/types'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import { openURL, resolveUrl } from '@/utils/url'

import CodeRenderer from './CodeRenderer'
import { HtmlContext } from './HtmlContext'
import IFrameRenderer from './IFrameRenderer'
import ImageRenderer from './ImageRenderer'
import TextRenderer from './TextRenderer'

const defaultProps: Omit<RenderHTMLProps, 'source'> = {
  domVisitors: {
    onElement: (el: any) => {
      const firstChild: any = first(
        isArray(el.children)
          ? el.children.filter((child: any) => !!child?.name)
          : []
      )

      if (firstChild && firstChild.name === 'p') {
        firstChild.attribs = { class: `mt-0 ${firstChild.attribs?.class}` }
      }
    },
  },
  classesStyles: {
    'mt-0': tw`mt-0`,
  },
  renderers: {
    pre: CodeRenderer,
    img: ImageRenderer,
    iframe: IFrameRenderer,
    _TEXT_: TextRenderer,
  },

  customHTMLElementModels: {
    iframe: HTMLElementModel.fromCustomModel({
      tagName: 'iframe',
      contentModel: HTMLContentModel.block,
    }),
  },

  defaultTextProps: {
    selectable: true,
  },
  enableExperimentalMarginCollapsing: true,
}

export default memo(
  Html,
  (prev: any, next: any) =>
    prev.source?.html! === next.source?.html &&
    prev.baseStyle?.color === next.baseStyle?.color
)

function Html({
  inModalScreen,
  paddingX = 32,
  ...renderHTMLProps
}: RenderHTMLProps & { inModalScreen?: boolean; paddingX?: number }) {
  const mergedProps = {
    ...defaultProps,
    ...renderHTMLProps,
  }

  const { width } = useWindowDimensions()

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

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <HtmlContext.Provider
      value={useMemo(
        () => ({
          onPreview: url => {
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
              imageUrls,
            })
          },
          paddingX,
        }),
        [imageUrls, setImageViewer, paddingX, inModalScreen]
      )}
    >
      <RenderHtml
        baseStyle={tw`text-tint-primary ${getFontSize(5)}`}
        contentWidth={width}
        tagsStyles={{
          h1: tw`${getFontSize(
            3
          )} pb-1.5 border-b border-solid border-tint-border`,
          h2: tw`${getFontSize(
            4
          )} pb-1.5 border-b border-solid border-tint-border`,
          h3: tw`${getFontSize(4)}`,
          h4: tw`${getFontSize(4)}`,
          h5: tw`${getFontSize(5)}`,
          h6: tw`${getFontSize(6)}`,
          p: tw`${getFontSize(5)}`,
          a: tw`text-tint-secondary no-underline`,
          li: tw`text-justify`,
          hr: {
            backgroundColor: tw.color(`border-tint-border`),
          },
          em: {
            fontStyle: 'italic',
          },
          ...mergedProps.tagsStyles,
        }}
        renderersProps={{
          a: {
            onPress: async (_, href: string) => {
              const resolvedURI = resolveUrl(href)

              if (resolvedURI.startsWith(baseURL)) {
                if (inModalScreen) {
                  navigation.goBack()
                }

                const [, routeName, arg] =
                  resolvedURI.slice(baseURL.length).match(/\/(\w+)\/(\w+)/) ||
                  []

                switch (routeName) {
                  case 't':
                    navigation.push('TopicDetail', {
                      id: parseInt(arg, 10),
                    })
                    break
                  case 'member':
                    navigation.push('MemberDetail', { username: arg })
                    break
                  case 'go':
                    navigation.push('NodeTopics', {
                      name: arg,
                    })
                    break
                  default:
                    openURL(resolvedURI)
                }
              } else {
                openURL(resolvedURI)
              }
            },
          },
        }}
        {...mergedProps}
      />
    </HtmlContext.Provider>
  )
}
