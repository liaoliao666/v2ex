import { Linking } from 'react-native'
import Toast from 'react-native-toast-message'

import { baseURL } from './request/baseURL'

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
  if (url.startsWith('about://')) return url.replace('about://', baseURL)
  if (url.startsWith('https://v2ex.com'))
    return url.replace('https://v2ex.com', baseURL)
  if (url.startsWith('/')) return `${baseURL}${url}`
  return url
}

export function isSvgURL(url: string) {
  return url.endsWith('.svg')
}

export async function openURL(url: string) {
  const supported = await Linking.canOpenURL(url)

  if (!supported) {
    Toast.show({
      type: 'error',
      text1: '不支持打开该链接',
    })
    return Promise.reject(new Error(`This url is not unsupported`))
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
