// import CookieManager from '@react-native-cookies/cookies'
import { isArray, noop } from 'lodash-es'

import { isExpoGo } from './isExpoGo'
import { baseURL } from './request/baseURL'

const RCTNetworking = require('react-native/Libraries/Network/RCTNetworking')

let CookieManager = {
  clearAll: noop,
  setFromResponse: noop,
}

if (!isExpoGo) {
  CookieManager = require('@react-native-cookies/cookies')
}

export function clearCookie() {
  return Promise.all([
    new Promise(ok => RCTNetworking.clearCookies(ok)),
    CookieManager.clearAll(true),
  ])
}

export function setCookie(cookies?: string[] | string) {
  return CookieManager.setFromResponse(
    baseURL,
    isArray(cookies) ? cookies.join(';') : ''
  )
}
