import CookieManager from '@react-native-cookies/cookies'
import { noop } from 'lodash-es'
import { useEffect, useReducer, useRef } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'

import { webviewUserAgent } from './helper'
import v2exMessage from './v2exMessage'

let outterResolve: () => void
let outterReject: (error: Error) => void

v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
  outterResolve = resolve
  outterReject = reject
})

export default function V2exWebview() {
  const webViewRef = useRef<WebView>(null)

  const [forceRenderKey, updateForceRenderKey] = useReducer(
    (num: number): number => num + 1,
    1
  )

  v2exMessage.clear = () => {
    webViewRef.current?.clearCache?.(true)
    CookieManager.clearAll(true)
  }

  v2exMessage.reload = () => {
    v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
      outterResolve = resolve
      outterReject = reject
    })
    updateForceRenderKey()
  }

  useEffect(() => {
    v2exMessage.inject = ({ id, config }) => {
      const run = `window.axios(${JSON.stringify(config)})
      .then(response => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            id: ${JSON.stringify(id)},
            response: response,
          })
        )
      })
      .catch(error => {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            id: ${JSON.stringify(id)},
            error: JSON.parse(
              JSON.stringify(error, Object.getOwnPropertyNames(error))
            ),
          })
        )
      }); void(0);`

      webViewRef.current?.injectJavaScript(run)
    }

    return () => {
      v2exMessage.inject = noop
    }
  }, [])

  return (
    <View
      key={forceRenderKey}
      style={tw`absolute w-0 h-0`}
      pointerEvents="none"
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: `${baseURL}/signin` }}
        onLoadEnd={() => outterResolve()}
        onError={() => outterReject(new Error('应用初始化失败'))}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onMessage={event => {
          let result = event.nativeEvent.data as any

          try {
            result = JSON.parse(result)
          } catch (error) {
            // empty
          }

          if (typeof result === 'object' && result !== null) {
            const listener = v2exMessage.linsteners.get(result.id)

            listener?.(
              result.error != null
                ? Promise.reject(result.error)
                : Promise.resolve(result.response)
            )
          }
        }}
        userAgent={webviewUserAgent}
      />
    </View>
  )
}
