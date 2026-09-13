import {
  HTMLContentModel,
  HTMLElementModel,
  RenderHTMLProps,
} from '@native-html/render'
import * as Clipboard from 'expo-clipboard'
import { first, isArray } from 'lodash-es'
import Toast from 'react-native-toast-message'

import { enabledWebviewAtom } from '@/jotai/enabledWebviewAtom'
import { store } from '@/jotai/store'
import { navigation } from '@/navigation/navigationRef'
import { BASE64_PREFIX } from '@/servicies/helper'
import tw from '@/utils/tw'
import { openURL, resolveURL } from '@/utils/url'

export const INLINE_IMAGE_TAG = 'v2ex-inline-img'
export const INLINE_BREAK_TAG = 'v2ex-inline-break'

const defaultProps: Omit<RenderHTMLProps, 'source'> = {
  domVisitors: {
    onElement: (el: any) => {
      if (el.name === 'br') el.name = INLINE_BREAK_TAG

      if (
        el.name === 'img' &&
        el.attribs?.loading?.toLowerCase() !== 'lazy' &&
        el.attribs?.class?.split(/\s+/).includes('embedded_image')
      ) {
        el.name = INLINE_IMAGE_TAG
      }

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

  customHTMLElementModels: {
    img: HTMLElementModel.fromCustomModel({
      tagName: 'img',
      contentModel: HTMLContentModel.block,
    }),
    [INLINE_IMAGE_TAG]: HTMLElementModel.fromCustomModel({
      tagName: INLINE_IMAGE_TAG,
      contentModel: HTMLContentModel.mixed,
    }),
    [INLINE_BREAK_TAG]: HTMLElementModel.fromCustomModel({
      tagName: INLINE_BREAK_TAG,
      contentModel: HTMLContentModel.textual,
    }),
    iframe: HTMLElementModel.fromCustomModel({
      tagName: 'iframe',
      contentModel: HTMLContentModel.block,
    }),

    input: HTMLElementModel.fromCustomModel({
      tagName: 'input',
      contentModel: HTMLContentModel.textual,
    }),
  },

  defaultTextProps: {
    selectable: true,
  },

  enableExperimentalMarginCollapsing: true,
}

export function getDefaultProps({
  inModalScreen,
  selectable = true,
}: {
  inModalScreen?: boolean
  selectable?: boolean
}): Omit<RenderHTMLProps, 'source'> {
  return {
    ...defaultProps,
    defaultTextProps: {
      ...defaultProps.defaultTextProps,
      selectable,
    },
    renderersProps: {
      a: {
        onPress: async (_, href: string) => {
          if (href.startsWith(BASE64_PREFIX)) {
            const decodedContent = href.slice(BASE64_PREFIX.length)
            Clipboard.setStringAsync(decodedContent).then(() =>
              Toast.show({
                type: 'success',
                text1: `已复制到粘贴板`,
                text2: decodedContent,
              })
            )
            return
          }

          if (inModalScreen) {
            navigation.goBack()
          }

          const resolvedURL = resolveURL(href)

          for (const path of ['t', 'member', 'go']) {
            const matched = resolvedURL.match(
              new RegExp(
                `^(?:https?:\\/\\/)?(?:\\w+\\.)?v2ex\\.com\/${path}\/(\\w+)`
              )
            )
            if (!matched) continue
            const arg = matched[1]

            switch (path) {
              case 't':
                navigation.push('TopicDetail', {
                  id: parseInt(arg, 10),
                })
                return
              case 'member':
                navigation.push('MemberDetail', { username: arg })
                return
              case 'go':
                navigation.push('NodeTopics', {
                  name: arg,
                })
                return
            }
          }

          if (store.get(enabledWebviewAtom)) {
            navigation.navigate('Webview', { url: resolvedURL })
          } else {
            openURL(resolvedURL)
          }
        },
      },
    },
  }
}
