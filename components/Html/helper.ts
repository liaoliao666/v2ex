import * as Clipboard from 'expo-clipboard'
import { first, isArray } from 'lodash-es'
import {
  HTMLContentModel,
  HTMLElementModel,
  RenderHTMLProps,
} from 'react-native-render-html'
import Toast from 'react-native-toast-message'

import { navigation } from '@/navigation/navigationRef'
import { BASE64_PREFIX } from '@/servicies/helper'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import { resolveURL } from '@/utils/url'

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
    reply_content: tw`flex-row`,
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

export function getDefaultProps({
  inModalScreen,
}: {
  inModalScreen?: boolean
}): Omit<RenderHTMLProps, 'source'> {
  return {
    ...defaultProps,
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

          const resolvedURL = resolveURL(href)

          if (resolvedURL.startsWith(baseURL)) {
            if (inModalScreen) {
              navigation.goBack()
            }

            const [, routeName, arg] =
              resolvedURL.slice(baseURL.length).match(/\/(\w+)\/(\w+)/) || []

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
                navigation.navigate('Webview', { url: resolvedURL })
            }
          } else {
            navigation.navigate('Webview', { url: resolvedURL })
          }
        },
      },
    },
  }
}
