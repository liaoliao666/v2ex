import { Platform } from 'react-native'

export const pcUserAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36`

export const phoneUserAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`

export const webviewUserAgent =
  Platform.OS === 'android' ? pcUserAgent : phoneUserAgent

export const checkIsLoginedScript =
  Platform.OS === 'android'
    ? `ReactNativeWebView.postMessage(!!$('#Top > div > div > div.tools > a:last').attr('onclick').includes('signout'))`
    : `ReactNativeWebView.postMessage($('#menu-body > div:last > a').attr("href").includes("signout"))`
