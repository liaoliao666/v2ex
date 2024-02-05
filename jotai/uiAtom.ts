import { getScale, toRgba, transparentize } from 'color2k'
import { atom } from 'jotai'

import { store } from './store'
import { colorSchemeAtom } from './themeAtom'
import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const defaultColors = {
  primary: {
    light: `rgb(29,155,240)`,
    dark: `rgb(29,155,240)`,
  },
  primaryContent: {
    light: 'rgba(255,255,255,1)',
    dark: 'rgba(255,255,255,1)',
  },
  danger: {
    light: `rgb(249,24,128)`,
    dark: `rgb(249,24,128)`,
  },
  foreground: {
    light: `#0f1419`,
    dark: `rgb(219,219,219)`,
  },
  default: {
    light: `#536471`,
    dark: `rgb(128,128,128)`,
  },
  base100: {
    light: 'rgba(255,255,255,1)',
    dark: '#262626',
  },
  base200: {
    light: 'rgb(239,243,244)',
    dark: 'rgb(32,35,39)',
  },
  base300: {
    light: '#0000000f',
    dark: '#ffffff0f',
  },
  divider: {
    light: '#eff3f4',
    dark: '#2f3336',
  },
  neutral: {
    light: 'rgb(185,202,211)',
    dark: 'rgb(62,65,68)',
  },
}

export type ThemeColors = {
  label: string
  name: string
  colorScheme: 'light' | 'dark'
  primary: string
  base100: string
  base200?: string
  base300?: string
  foreground?: string
  input?: string
  primaryContent?: string
  default?: string
  divider?: string
  neutral: string
}

export const themeColorsMap: Record<string, ThemeColors> = {
  aqua: {
    label: '水色',
    name: 'aqua',
    colorScheme: 'dark',
    primary: 'rgba(9,236,243,1)',
    base100: 'rgba(52,93,167,1)',
    primaryContent: 'rgba(0,83,85,1)',
    neutral: 'rgba(59,138,196,1)',
  },
  black: {
    label: '黑色',
    name: 'black',
    colorScheme: 'dark',
    primary: 'rgba(55,55,55,1)',
    base100: 'rgba(0,0,0,1)',
    base200: 'rgba(20,20,20,1)',
    base300: 'rgba(38,38,38,1)',
    foreground: 'rgba(214,214,214,1)',
    neutral: 'rgba(55,55,55,1)',
  },
  bumblebee: {
    label: '黄蜂',
    name: 'bumblebee',
    colorScheme: 'light',
    primary: 'rgba(255,217,0,1)',
    base100: 'rgba(255,255,255,1)',
    primaryContent: 'rgba(76,69,40,1)',
    neutral: 'rgba(6,0,35,1)',
  },
  cmyk: {
    label: 'CMYK',
    name: 'cmyk',
    colorScheme: 'light',
    primary: 'rgba(69,174,238,1)',
    base100: 'rgba(255,255,255,1)',
    neutral: 'rgba(26,26,26,1)',
  },
  corporate: {
    label: '企业',
    name: 'corporate',
    colorScheme: 'light',
    primary: 'rgba(77,110,255,1)',
    base100: 'rgba(255,255,255,1)',
    foreground: 'rgba(24,26,42,1)',
    neutral: 'rgba(24,26,42,1)',
  },
  cupcake: {
    label: '杯子蛋糕',
    name: 'cupcake',
    colorScheme: 'light',
    primary: 'rgba(101,195,200,1)',
    base100: 'rgba(250,247,245,1)',
    base200: 'rgba(239,234,230,1)',
    base300: 'rgba(231,226,223,1)',
    foreground: 'rgba(41,19,52,1)',
    neutral: 'rgba(41,19,52,1)',
  },
  cyberpunk: {
    label: '赛博朋克',
    name: 'cyberpunk',
    colorScheme: 'light',
    primary: 'rgba(255,101,150,1)',
    base100: 'rgba(255,242,72,1)',
    neutral: 'rgba(17,26,59,1)',
  },
  dark: {
    label: '深色',
    name: 'dark',
    colorScheme: 'dark',
    primary: 'rgba(116,128,255,1)',
    base100: 'rgba(29,35,42,1)',
    base200: 'rgba(25,30,36,1)',
    base300: 'rgba(21,25,30,1)',
    foreground: 'rgba(166,173,187,1)',
    neutral: 'rgba(42,50,60,1)',
  },
  dracula: {
    label: '德古拉',
    name: 'dracula',
    colorScheme: 'dark',
    primary: 'rgba(255,121,198,1)',
    base100: 'rgba(40,42,54,1)',
    foreground: 'rgba(248,248,242,1)',
    neutral: 'rgba(65,69,88,1)',
  },
  emerald: {
    label: '翠绿',
    name: 'emerald',
    colorScheme: 'light',
    primary: 'rgba(102,204,138,1)',
    base100: 'rgba(255,255,255,1)',
    foreground: 'rgba(51,60,77,1)',
    primaryContent: 'rgba(34,61,48,1)',
    neutral: 'rgba(51,60,77,1)',
  },
  fantasy: {
    label: '幻想',
    name: 'fantasy',
    colorScheme: 'light',
    primary: 'rgba(109,0,118,1)',
    base100: 'rgba(255,255,255,1)',
    foreground: 'rgba(31,41,55,1)',
    neutral: 'rgba(31,41,55,1)',
  },
  forest: {
    label: '森林',
    name: 'forest',
    colorScheme: 'dark',
    primary: 'rgba(30,184,84,1)',
    base100: 'rgba(23,18,18,1)',
    primaryContent: 'rgba(0,0,0,1)',
    neutral: 'rgba(25,54,45,1)',
  },
  garden: {
    label: '花园',
    name: 'garden',
    colorScheme: 'light',
    primary: 'rgba(254,0,117,1)',
    base100: 'rgba(233,231,231,1)',
    foreground: 'rgba(16,15,15,1)',
    primaryContent: 'rgba(255,255,255,1)',
    neutral: 'rgba(41,30,0,1)',
  },
  halloween: {
    label: '万圣节',
    name: 'halloween',
    colorScheme: 'dark',
    primary: 'rgba(255,143,0,1)',
    base100: 'rgba(33,33,33,1)',
    primaryContent: 'rgba(19,22,22,1)',
    neutral: 'rgba(47,27,5,1)',
  },
  light: {
    label: '亮色',
    name: 'light',
    colorScheme: 'light',
    primary: 'rgba(74,0,255,1)',
    base100: 'rgba(255,255,255,1)',
    base200: 'rgba(242,242,242,1)',
    base300: 'rgba(229,230,230,1)',
    foreground: 'rgba(31,41,55,1)',
    neutral: 'rgba(43,52,64,1)',
  },
  lofi: {
    label: 'Lo-fi',
    name: 'lofi',
    colorScheme: 'light',
    primary: 'rgba(13,13,13,1)',
    base100: 'rgba(255,255,255,1)',
    base200: 'rgba(242,242,242,1)',
    base300: 'rgba(230,229,229,1)',
    foreground: 'rgba(0,0,0,1)',
    primaryContent: 'rgba(255,255,255,1)',
    neutral: 'rgba(0,0,0,1)',
  },
  luxury: {
    label: '奢侈',
    name: 'luxury',
    colorScheme: 'dark',
    primary: 'rgba(255,255,255,1)',
    base100: 'rgba(9,9,11,1)',
    base200: 'rgba(23,22,24,1)',
    base300: 'rgba(46,45,47,1)',
    foreground: 'rgba(220,165,76,1)',
    neutral: 'rgba(51,24,0,1)',
  },
  pastel: {
    label: '淡彩',
    name: 'pastel',
    colorScheme: 'light',
    primary: 'rgba(209,193,215,1)',
    base100: 'rgba(255,255,255,1)',
    base200: 'rgba(249,250,251,1)',
    base300: 'rgba(209,213,219,1)',
    neutral: 'rgba(112,172,199,1)',
  },
  retro: {
    label: '复古',
    name: 'retro',
    colorScheme: 'light',
    primary: 'rgba(239,153,149,1)',
    base100: 'rgba(236,227,202,1)',
    base200: 'rgba(228,216,180,1)',
    base300: 'rgba(219,202,154,1)',
    foreground: 'rgba(40,36,37,1)',
    primaryContent: 'rgba(40,36,37,1)',
    neutral: 'rgba(46,40,42,1)',
  },
  synthwave: {
    label: '蒸汽波',
    name: 'synthwave',
    colorScheme: 'dark',
    primary: 'rgba(231,121,193,1)',
    base100: 'rgba(26,16,61,1)',
    foreground: 'rgba(249,247,253,1)',
    neutral: 'rgba(34,21,81,1)',
  },
  valentine: {
    label: '情人节',
    name: 'valentine',
    colorScheme: 'light',
    primary: 'rgba(233,109,123,1)',
    base100: 'rgba(250,231,244,1)',
    foreground: 'rgba(99,44,59,1)',
    neutral: 'rgba(175,70,112,1)',
  },
  wireframe: {
    label: '线框',
    name: 'wireframe',
    colorScheme: 'light',
    primary: 'rgba(184,184,184,1)',
    base100: 'rgba(255,255,255,1)',
    base200: 'rgba(238,238,238,1)',
    base300: 'rgba(221,221,221,1)',
    neutral: 'rgba(235,235,235,1)',
  },
  autumn: {
    label: '秋季',
    name: 'autumn',
    colorScheme: 'light',
    primary: 'rgba(140,3,39,1)',
    base100: 'rgba(241,241,241,1)',
    neutral: 'rgba(130,106,92,1)',
  },
  business: {
    label: '商务',
    name: 'business',
    colorScheme: 'dark',
    primary: 'rgba(28,78,128,1)',
    base100: 'rgba(32,32,32,1)',
    neutral: 'rgba(35,40,46,1)',
  },
  acid: {
    label: '酸性',
    name: 'acid',
    colorScheme: 'light',
    primary: 'rgba(255,0,255,1)',
    base100: 'rgba(250,250,250,1)',
    neutral: 'rgba(20,1,81,1)',
  },
  lemonade: {
    label: '柠檬水',
    name: 'lemonade',
    colorScheme: 'light',
    primary: 'rgba(65,148,0,1)',
    base100: 'rgba(248,253,239,1)',
    neutral: 'rgba(52,51,0,1)',
  },
  night: {
    label: '夜晚',
    name: 'night',
    colorScheme: 'dark',
    primary: 'rgba(56,189,248,1)',
    base100: 'rgba(15,23,42,1)',
    neutral: 'rgba(30,41,59,1)',
  },
  coffee: {
    label: '咖啡',
    name: 'coffee',
    colorScheme: 'dark',
    primary: 'rgba(219,146,75,1)',
    base100: 'rgba(32,22,31,1)',
    foreground: 'rgba(197,159,96,1)',
    neutral: 'rgba(18,12,18,1)',
  },
  winter: {
    label: '冬季',
    name: 'winter',
    colorScheme: 'light',
    primary: 'rgba(0,105,255,1)',
    base100: 'rgba(255,255,255,1)',
    base200: 'rgba(242,247,255,1)',
    base300: 'rgba(227,233,244,1)',
    foreground: 'rgba(57,78,106,1)',
    neutral: 'rgba(2,20,49,1)',
  },
  dim: {
    label: '昏暗',
    name: 'dim',
    colorScheme: 'dark',
    primary: 'rgba(159,232,141,1)',
    base100: 'rgba(42,48,60,1)',
    base200: 'rgba(36,41,51,1)',
    base300: 'rgba(32,37,46,1)',
    foreground: 'rgba(178,204,214,1)',
    neutral: 'rgba(28,33,43,1)',
  },
  nord: {
    label: '北欧',
    name: 'nord',
    colorScheme: 'light',
    primary: 'rgba(94,129,172,1)',
    base100: 'rgba(236,239,244,1)',
    base200: 'rgba(229,233,240,1)',
    base300: 'rgba(216,222,233,1)',
    foreground: 'rgba(46,52,64,1)',
    neutral: 'rgba(76,86,106,1)',
  },
  sunset: {
    label: '日落',
    name: 'sunset',
    colorScheme: 'dark',
    primary: 'rgba(255,134,91,1)',
    base100: 'rgba(18,28,34,1)',
    base200: 'rgba(14,23,30,1)',
    base300: 'rgba(9,19,25,1)',
    foreground: 'rgba(159,185,208,1)',
    neutral: 'rgba(27,38,44,1)',
  },
}

export type FontScale = 'small' | 'medium' | 'large' | 'super'

export const fontSizes = {
  xxxlarge: [23, 32],
  xxlarge: [21, 30],
  xlarge: [19, 28],
  large: [17, 26],
  medium: [15, 24],
  small: [13, 22],
  tiny: [11, 20],
}

const fontSizeLevelMap = [
  [-1, -2],
  [-1, -1],
  [0, 0],
  [2, 2],
  [3, 4],
]

/**
 * 字体缩放大小
 */
export const fontScaleAtom = atomWithAsyncStorage('fontScaleLevel', 2)

export function formatColor(color: string) {
  return toRgba(color).replace(/\s/g, '')
}

function convertColors(input: ThemeColors) {
  function generateForegroundColorFrom(color: string, percentage = 0.07) {
    return formatColor(
      getScale(
        color,
        input.colorScheme === 'dark' ? 'white' : 'black'
      )(percentage)
    )
  }

  const resultObj = { ...input }

  if (!input.base200) {
    resultObj.base200 = generateForegroundColorFrom(input.base100, 0.07)
  }
  if (!input.base300) {
    if (input.base200) {
      resultObj.base300 = generateForegroundColorFrom(input.base200, 0.07)
    } else {
      resultObj.base300 = generateForegroundColorFrom(input.base100, 0.14)
    }
  }

  if (!resultObj.foreground) {
    resultObj.foreground = generateForegroundColorFrom(resultObj.base100, 0.8)
  }
  if (!resultObj.primaryContent) {
    resultObj.primaryContent = `rgba(255,255,255,1)`
  }
  if (!resultObj.default) {
    resultObj.default = formatColor(transparentize(resultObj.foreground, 0.2))
  }
  if (!resultObj.divider) {
    resultObj.divider = formatColor(transparentize(resultObj.foreground, 0.9))
  }

  return resultObj
}

type ThemeName = {
  light?: string
  dark?: string
}

function getColors(themeName: ThemeName) {
  const lightTheme =
    themeName.light && convertColors(themeColorsMap[themeName.light])
  const darkTheme =
    themeName.dark && convertColors(themeColorsMap[themeName.dark])

  return Object.fromEntries(
    Object.entries(defaultColors).map(([key, obj]) => [
      key,
      {
        light: (lightTheme as any)?.[key] || obj.light,
        dark: (darkTheme as any)?.[key] || obj.dark,
      },
    ])
  ) as typeof defaultColors
}

export const colorsAtom = atom(get => {
  return getColors(get(themeNameAtom)!)
})

export const themeNameAtom = atomWithAsyncStorage<ThemeName>('themeName', {})

export type UI = {
  colors: Record<keyof typeof defaultColors, string>
  fontSize: Record<keyof typeof fontSizes, string>
}

export function getUI(
  themeName?: ThemeName,
  fontScale = store.get(fontScaleAtom)!,
  colorScheme = store.get(colorSchemeAtom)!
): UI {
  const colors = themeName ? getColors(themeName) : store.get(colorsAtom)!

  return {
    colors: {
      ...Object.entries(colors).reduce((a, [k, o]) => {
        a[k as keyof UI['colors']] = o[colorScheme]
        return a
      }, {} as UI['colors']),
    },
    fontSize: Object.entries(fontSizes).reduce(
      (a, [k, [fontSize, lineHeight]]) => {
        const [size, leading] = fontSizeLevelMap[fontScale] || []
        a[k as keyof UI['fontSize']] = `text-[${
          isFinite(size) ? fontSize + size : fontSize
        }px] leading-[${
          isFinite(leading) ? lineHeight + leading : lineHeight
        }px]`
        return a
      },
      {} as UI['fontSize']
    ),
  }
}

export const uiAtom = atom(get => {
  get(colorsAtom)
  get(colorSchemeAtom)
  get(fontScaleAtom)
  get(themeNameAtom)
  return getUI()
})
