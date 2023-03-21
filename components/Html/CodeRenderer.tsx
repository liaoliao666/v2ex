import { load } from 'cheerio'
import hljs from 'highlight.js'
import { useAtomValue } from 'jotai'
import { useContext, useMemo } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import RenderHTML, {
  CustomBlockRenderer,
  MixedStyleDeclaration,
} from 'react-native-render-html'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

import { HtmlContext } from './HtmlContext'
import TextRenderer from './TextRenderer'
import { getDefaultProps } from './helper'

const CodeRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { inModalScreen } = useContext(HtmlContext)

  const { width } = useWindowDimensions()

  const { html, hasHtmlTag } = useMemo(() => {
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
      hasHtmlTag: !!value?.match(/<\/\w+/),
    }
  }, [tnode.domNode])

  const colorScheme = useAtomValue(colorSchemeAtom)

  const WrapView = hasHtmlTag ? ScrollView : View

  return (
    <WrapView
      horizontal
      nestedScrollEnabled
      style={tw.style(style, `bg-[#fafafa] dark:bg-[#282c34] rounded`)}
    >
      <RenderHTML
        contentWidth={width}
        baseStyle={tw.style(
          `text-[#383a42] dark:text-[#abb2bf] px-3 ${getFontSize(5)}`
        )}
        tagsStyles={{
          pre: tw`my-2`,
          a: tw`text-tint-secondary no-underline`,
          em: {
            fontStyle: 'italic',
          },
        }}
        classesStyles={colorScheme === 'dark' ? atomDark : atomLight}
        source={{ html }}
        renderers={{ _TEXT_: TextRenderer }}
        {...getDefaultProps({ inModalScreen })}
      />
    </WrapView>
  )
}

export default CodeRenderer

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
  ) as unknown as Readonly<Record<string, MixedStyleDeclaration>>
}
