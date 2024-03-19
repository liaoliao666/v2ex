import { load } from 'cheerio'
import hljs from 'highlight.js'
import { useAtomValue } from 'jotai'
import { some } from 'lodash-es'
import { useContext, useMemo } from 'react'
import { ScrollView, View } from 'react-native'
import RenderHTML, {
  CustomBlockRenderer,
  MixedStyleDeclaration,
  TNode,
} from 'react-native-render-html'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import { isDefaultBgColor, uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'
import { useScreenWidth } from '@/utils/useScreenWidth'

import { HtmlContext } from './HtmlContext'
import TextRenderer from './TextRenderer'
import { getDefaultProps } from './helper'

const CodeRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const context = useContext(HtmlContext)

  const { inModalScreen, paddingX } = context

  const screenWidth = useScreenWidth()

  const { html, isCode } = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const $code = $('code')
    const language = $code
      .attr('class')
      ?.split(' ')
      .find(cls => cls.startsWith('language-'))
      ?.replace(`language-`, '')
    const text = $code.text()
    const value =
      language && hljs.listLanguages().includes(language)
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value

    return {
      html: `<pre><code>${value}</code></pre>`,
      isCode: !!language || /(\=|\{|\[)/.test(text),
    }
  }, [tnode.domNode])

  const colorScheme = useAtomValue(colorSchemeAtom)

  const WrapView = isCode ? ScrollView : View

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <HtmlContext.Provider
      value={useMemo(() => {
        const copy = { ...context }

        if (!copy.selectOnly && !hasLink(tnode)) {
          copy.selectOnly = true
        }

        return copy
      }, [context, tnode])}
    >
      <View
        style={tw.style(
          style,
          `rounded`,
          isDefaultBgColor(colors.base100)
            ? `bg-[#fafafa] dark:bg-[#282c34]`
            : `bg-[${colors.base200}] bg-opacity-50 dark:bg-opacity-100`
        )}
      >
        <WrapView horizontal nestedScrollEnabled>
          <RenderHTML
            {...getDefaultProps({ inModalScreen })}
            contentWidth={screenWidth - paddingX}
            baseStyle={tw.style(
              `px-3 ${fontSize.medium}`,
              isDefaultBgColor(colors.base100)
                ? `text-[#383a42] dark:text-[#abb2bf]`
                : `text-[${colors.foreground}]`
            )}
            tagsStyles={{
              pre: tw`mt-2 mb-0`,
              a: tw`text-[${colors.primary}] no-underline`,
              em: tw`italic`,
            }}
            classesStyles={colorScheme === 'dark' ? atomDark : atomLight}
            source={{ html }}
            renderers={{ _TEXT_: TextRenderer }}
          />
        </WrapView>
      </View>
    </HtmlContext.Provider>
  )
}

export default CodeRenderer

function hasLink(tnode: TNode): boolean {
  return tnode.domNode?.name === 'a' || some(tnode.children, hasLink)
}

const atomLight = convertCSSToObject({
  '.hljs-comment,.hljs-quote': { color: '#a0a1a7' },
  '.hljs-doctag,.hljs-formula,.hljs-keyword': { color: '#a626a4' },
  '.hljs-deletion,.hljs-name,.hljs-section,.hljs-selector-tag,.hljs-subst': {
    color: '#e45649',
  },
  '.hljs-literal': { color: '#0184bb' },
  '.hljs-addition,.hljs-attribute,.hljs-meta .hljs-string,.hljs-regexp,.hljs-string':
    {
      color: '#50a14f',
    },
  '.hljs-attr,.hljs-number,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-pseudo,.hljs-template-variable,.hljs-type,.hljs-variable':
    {
      color: '#986801',
    },
  '.hljs-bullet,.hljs-link,.hljs-meta,.hljs-selector-id,.hljs-symbol,.hljs-title':
    {
      color: '#4078f2',
    },
  '.hljs-built_in,.hljs-class .hljs-title,.hljs-title.class_': {
    color: '#c18401',
  },
  '.hljs-strong': { fontWeight: '700' },
  '.hljs-link': { textDecoration: 'underline' },
})

const atomDark = convertCSSToObject({
  '.hljs-comment, .hljs-quote': {
    color: 'rgb(92, 99, 112)',
  },
  '.hljs-doctag, .hljs-formula, .hljs-keyword': { color: 'rgb(198, 120, 221)' },
  '.hljs-deletion, .hljs-name, .hljs-section, .hljs-selector-tag, .hljs-subst':
    {
      color: 'rgb(224, 108, 117)',
    },
  '.hljs-literal': { color: 'rgb(86, 182, 194)' },
  '.hljs-addition, .hljs-attribute, .hljs-meta .hljs-string, .hljs-regexp, .hljs-string':
    {
      color: 'rgb(152, 195, 121)',
    },
  '.hljs-attr, .hljs-number, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-pseudo, .hljs-template-variable, .hljs-type, .hljs-variable':
    {
      color: 'rgb(209, 154, 102)',
    },
  '.hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-symbol, .hljs-title':
    {
      color: 'rgb(97, 174, 238)',
    },
  '.hljs-built_in, .hljs-class .hljs-title, .hljs-title.class_': {
    color: 'rgb(230, 192, 123)',
  },
  '.hljs-strong': { fontWeight: 700 },
  '.hljs-link': { textDecoration: 'underline' },
})

function convertCSSToObject(
  css: Record<string, any>
): Readonly<Record<string, MixedStyleDeclaration>> {
  return Object.fromEntries(
    Object.entries(css).flatMap(([key, val]) =>
      key.split(',').map(o => [o.trim().slice(1), val])
    )
  )
}
