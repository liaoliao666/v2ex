import { load } from 'cheerio'
import Constants from 'expo-constants'
import hljs from 'highlight.js'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import RenderHTML, {
  CustomBlockRenderer,
  MixedStyleDeclaration,
} from 'react-native-render-html'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

const CodeRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { width } = useWindowDimensions()

  const html = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const $code = $('code')
    const language = $code
      .attr('class')
      ?.split(' ')
      .find(cls => cls.startsWith('language-'))
      ?.replace(`language-`, '')
    const text = $code.text()

    return `<pre><code>${
      language && hljs.listLanguages().includes(language)
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value
    }</code></pre>`
  }, [tnode.domNode])

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      style={tw.style(style, `bg-[#fafafa] dark:bg-[#282c34] rounded`)}
    >
      <RenderHTML
        contentWidth={width}
        baseStyle={tw`text-[#383a42] dark:text-[#abb2bf] text-body-5`}
        tagsStyles={{
          code: tw`p-3`,
          h1: tw`text-body-1`,
          h2: tw`text-body-2`,
          h3: tw`text-body-3`,
          h4: tw`text-body-4`,
          h5: tw`text-body-5`,
          h6: tw`text-body-6`,
          p: tw`text-body-5`,
        }}
        classesStyles={colorScheme === 'dark' ? atomDark : atomLight}
        systemFonts={Constants.systemFonts}
        source={{ html }}
      />
    </ScrollView>
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
