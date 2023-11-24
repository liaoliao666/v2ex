// import CookieManager from '@react-native-cookies/cookies'
import { isArray, noop } from 'lodash-es'

import { isExpoGo } from './isExpoGo'
import { sleep } from './sleep'
import { getBaseURL } from './url'

const RCTNetworking =
  require(`react-native/Libraries/Network/RCTNetworking`).default

let CookieManager = {
  clearAll: noop,
  setFromResponse: noop,
  get: noop,
}

if (!isExpoGo) {
  CookieManager = require('@react-native-cookies/cookies')
}

export function clearCookie() {
  return Promise.race([
    Promise.all([
      new Promise(ok => RCTNetworking.clearCookies(ok)),
      CookieManager.clearAll(),
      CookieManager.clearAll(true),
    ]),
    sleep(300),
  ]).catch(noop)
}

export function setCookie(cookies: string[] | string) {
  return Promise.race([
    CookieManager.setFromResponse(
      getBaseURL(),
      isArray(cookies) ? cookies.join(';') : cookies
    ),
    sleep(300),
  ]).catch(noop)
}

export async function getCookie(): Promise<string> {
  return Object.entries(
    ((await Promise.race([
      CookieManager.get(getBaseURL()),
      sleep(300),
    ])) as any) || {}
  )
    .map(([key, { value }]: any) => `${key}=${value}`)
    .join(';')
}
