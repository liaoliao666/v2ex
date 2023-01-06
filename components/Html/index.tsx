import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { load } from 'cheerio'
import Constants from 'expo-constants'
import { useSetAtom } from 'jotai'
import { findIndex, first, isString } from 'lodash-es'
import { memo, useMemo } from 'react'
import { Alert, useWindowDimensions } from 'react-native'
import RenderHtml, {
  HTMLContentModel,
  HTMLElementModel,
  RenderHTMLProps,
} from 'react-native-render-html'

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

const defaultProps: Omit<RenderHTMLProps, 'source'> = {
  domVisitors: {
    onElement: el => {
      const firstChild = first(el.children)
      // @ts-ignore
      if (firstChild && firstChild.name === 'p')
        // @ts-ignore
        firstChild.attribs = { class: 'mt-0' }
    },
  },
  classesStyles: {
    'mt-0': {
      marginTop: 0,
    },
  },
  renderers: {
    pre: CodeRenderer,
    img: ImageRenderer,
    iframe: IFrameRenderer,
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
  systemFonts: Constants.systemFonts,
}

export default memo(
  Html,
  (prevProps, nextProps) =>
    (prevProps.source as any)?.html! !== (nextProps.source as any)?.html
)

function Html({
  inModalScreen,
  youtubePaddingX,
  ...renderHTMLProps
}: RenderHTMLProps & { inModalScreen?: boolean; youtubePaddingX?: number }) {
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
          youtubePaddingX,
        }),
        [imageUrls, setImageViewer, youtubePaddingX, inModalScreen]
      )}
    >
      <RenderHtml
        baseStyle={tw`text-tint-primary text-body-5`}
        contentWidth={width}
        tagsStyles={{
          h1: tw`text-body-3 border-b border-solid border-tint-border`,
          h2: tw`text-body-4 border-b border-solid border-tint-border`,
          h3: tw`text-body-4 border-b border-solid border-tint-border`,
          h4: tw`text-body-4`,
          h5: tw`text-body-5`,
          h6: tw`text-body-6`,
          p: tw`text-body-5`,
          a: tw`text-tint-secondary no-underline`,
          hr: {
            backgroundColor: tw`border-tint-border`.borderColor as string,
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
                  resolvedURI
                    .slice(baseURL.length)
                    .match(/\/(\w+)\/([\w|\d|-]+)/) || []

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
