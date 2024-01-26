import { Linking } from 'react-native'
import Toast from 'react-native-toast-message'

import { baseUrlAtom, v2exURL } from '@/jotai/baseUrlAtom'
import { store } from '@/jotai/store'

export function getURLSearchParams(url?: string): Record<string, string> {
  if (!url) return {}
  const query = url.includes('?') ? url.split('?')[1] : url
  const params = Object.fromEntries(
    query.split('&').map(pair => pair.split('='))
  )
  return params
}

export function resolveURL(url: string) {
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('about://')) return url.replace('about://', getBaseURL())
  if (url.startsWith('https://v2ex.com'))
    return url.replace('https://v2ex.com', getBaseURL())
  if (url.startsWith('/')) return `${getBaseURL()}${url}`
  return url
}

const svgURLS = ['img.shields.io', 'badgen.net', 'img.badgesize.io']

export function isSvgURL(url: string) {
  return url.includes('.svg') || svgURLS.some(svgURL => url.includes(svgURL))
}

export function isGifURL(url: string) {
  return url.includes('.gif')
}

export async function openURL(url: string) {
  const supported = await Linking.canOpenURL(url)

  if (!supported) {
    Toast.show({
      type: 'error',
      text1: '不支持打开该链接',
    })
    return Promise.reject(new Error(`This url is unsupported`))
  }

  try {
    await Linking.openURL(url)
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: '打开链接失败',
    })
    return Promise.reject(new Error(`Failed to openURL`))
  }
}

export function getBaseURL() {
  return store.get(baseUrlAtom) || v2exURL
}

export function isValidURL(url: string) {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // validate fragment locator
  return !!urlPattern.test(url)
}

/**
 * Generate dataURI raw BMP image
 *
 * @param width - image width (num of pixels)
 * @param pixels - 1D array of RGBA pixels (pixel = 4 numbers in
 *                 range 0-255; staring from left bottom corner)
 * @return dataURI string
 */
export function genBMPUri(width: number, pixels: number[]) {
  const LE = (n: number) =>
    (n + 2 ** 32).toString(16).match(/\B../g)!.reverse().join('')
  const wh = LE(width) + LE(pixels.length / width / 4)
  const size = LE(108 + pixels.length)
  const r = (n: number) => '0'.repeat(n)
  const head = `424d${size}ZZ7AZ006CZ00${wh}01002Z3${r(50)}FFZFFZFFZZZFF${r(
    104
  )}`

  return (
    'data:image/bmp,' +
    [
      ...head.replace(/Z/g, '0000').match(/../g)!,
      ...pixels.map(x => x.toString(16).padStart(2, '0')),
    ]
      .map(x => '%' + x)
      .join('')
  )
}
