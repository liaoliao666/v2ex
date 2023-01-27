import { sleep } from '@tanstack/query-core/build/lib/utils'
import { noop } from 'lodash-es'
import { useEffect, useReducer, useRef } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import { clearCookie } from '@/utils/cookie'
import { baseURL } from '@/utils/request/baseURL'
import { timeout } from '@/utils/timeout'
import tw from '@/utils/tw'

import v2exMessage from './v2exMessage'

enum ActionType {
  Request = 'REQUEST',
  IsConnect = 'IS_CONNECT',
  GetCaptcha = 'GET_CAPTCHA',
}

let handleLoad: () => void
let handleLoadError: (error: Error) => void

v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
  handleLoad = resolve
  handleLoadError = reject
})

let handleCheckConnect: () => void = noop

export default function V2exWebview() {
  const webViewRef = useRef<WebView>(null)

  const [forceRenderKey, updateForceRenderKey] = useReducer(
    (num: number): number => num + 1,
    1
  )

  v2exMessage.injectCheckConnectScript = () => {
    webViewRef.current?.injectJavaScript(`
      ReactNativeWebView.postMessage(
        JSON.stringify({
          type: '${ActionType.IsConnect}',
        })
      ); void(0);
    `)
    return timeout(new Promise(ok => (handleCheckConnect = ok)), 300)
  }

  v2exMessage.clearWebviewCache = async () => {
    await Promise.race([clearCookie(), sleep(500)])
    webViewRef.current?.clearCache?.(true)
  }

  v2exMessage.reloadWebview = () => {
    v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
      handleLoad = resolve
      handleLoadError = reject
    })
    updateForceRenderKey()
    return v2exMessage.loadV2exWebviewPromise
  }

  useEffect(() => {
    v2exMessage.injectRequestScript = ({ id, config }) => {
      const transformResponseScript =
        config.transformResponseScript || `function(data) {return data}`

      const run = `axios(${JSON.stringify(config)})
      .then(async response => {
        response.data = await (${transformResponseScript})(response.data)
        ReactNativeWebView.postMessage(
          JSON.stringify({
            id: '${id}',
            response: response,
            type: '${ActionType.Request}'
          })
        )
      })
      .catch(error => {
        ReactNativeWebView.postMessage(
          JSON.stringify({
            id: '${id}',
            error: JSON.parse(
              JSON.stringify(error, Object.getOwnPropertyNames(error))
            ),
            type: '${ActionType.Request}'
          })
        )
      }); void(0);`

      webViewRef.current?.injectJavaScript(run)
    }

    return () => {
      v2exMessage.injectRequestScript = noop
    }
  }, [])

  return (
    <View style={tw`absolute w-0 h-0`} pointerEvents="none">
      <WebView
        key={forceRenderKey}
        ref={webViewRef}
        source={{
          uri: `${baseURL}/signin`,
        }}
        onLoadEnd={() => handleLoad()}
        onError={() => {
          const err = new Error('请检查你的网络设置')
          err.name = `应用初始化失败`
          handleLoadError(err)
        }}
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

          switch (result.type as ActionType) {
            case ActionType.Request: {
              const listener = v2exMessage.linsteners.get(result.id)

              listener?.(
                result.error != null
                  ? Promise.reject(result.error)
                  : Promise.resolve(result.response)
              )
              break
            }

            case ActionType.IsConnect: {
              handleCheckConnect()
              break
            }
          }
        }}
        userAgent={`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36`}
      />
    </View>
  )
}
