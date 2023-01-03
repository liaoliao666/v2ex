import CookieManager from '@react-native-cookies/cookies'

const RCTNetworking = require('react-native/Libraries/Network/RCTNetworking')

export function clearCookie() {
  return Promise.all([
    new Promise(ok => RCTNetworking.clearCookies(ok)),
    CookieManager.clearAll(true),
  ])
}
