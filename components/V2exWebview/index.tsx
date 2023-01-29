import { noop } from 'lodash-es'
import { useEffect, useReducer, useRef } from 'react'
import { Alert, Platform, View } from 'react-native'
import WebView from 'react-native-webview'

import { clearCookie } from '@/utils/cookie'
import { baseURL } from '@/utils/request/baseURL'
import { timeout } from '@/utils/timeout'
import tw from '@/utils/tw'

import { userAgent } from './userAgent'
import v2exMessage from './v2exMessage'

enum ActionType {
  Request = 'REQUEST',
  IsConnect = 'IS_CONNECT',
  Login = 'LOGIN',
  IsLimitLogin = 'IS_LIMIT_LOGIN',
}

enum LoginStatus {
  '2fa' = '2FA',
  success = 'SUCCESS',
  error = 'ERROR',
}

const checkSubmitStatus = `
(function() {
  if ($('#otp_code').length) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: '${LoginStatus['2fa']}',
      type: '${ActionType.Login}',
    }));
    return;
  }

  const onclick = $('#Top > div > div > div.tools > a:last').attr('onclick');
  if (onclick && onclick.includes('signout')) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: '${LoginStatus.success}',
      type: '${ActionType.Login}'
    }));
  } else if (!location.pathname.includes("signin")) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: '${LoginStatus.error}',
      type: '${ActionType.Login}',
      payload: '请求超时',
      wrongPath: true,
      path: location.pathname
    }));
  } else {
    const problem = $('#Main > div.box > div.problem > ul > li').eq(0).text().trim()
    window.ReactNativeWebView.postMessage(JSON.stringify({
      status: '${LoginStatus.error}',
      type: '${ActionType.Login}',
      payload: problem
    }));
  }
}()); void(0);
`

const get2FASubmitCode = (code: string) => `(function() {
  try {
    const input = document.getElementById('otp_code');
    input.value = ${JSON.stringify(code)}
    document.querySelector('[type="submit"]').click();
  } catch (err) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      error: '${LoginStatus.error}',
      message: err.message
    }))
  }
}()); void(0);`

let handleLoad: () => void
let handleLoadError: (error: Error) => void
let handleResolveLogin: () => void
let handleRejectLogin: (error: Error) => void
let handleIsLimitLogin: (is_limit: boolean) => any
let isLogining = false

v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
  handleLoad = resolve
  handleLoadError = reject
})

let handleCheckConnect: () => void = noop

let uri = baseURL

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
    await clearCookie()
    webViewRef.current?.clearCache?.(true)
  }

  v2exMessage.reloadWebview = () => {
    v2exMessage.loadingV2exWebview = true
    v2exMessage.loadV2exWebviewPromise = new Promise((resolve, reject) => {
      handleLoad = resolve
      handleLoadError = reject
    })
    v2exMessage.loadV2exWebviewPromise.finally(() => {
      v2exMessage.loadingV2exWebview = false
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
            error: (function toJSON(obj) {
              var alt = {}
              Object.getOwnPropertyNames(obj).forEach(function (key) {
                alt[key] = obj[key]
              }, obj)
              return alt
            })(error),
            type: '${ActionType.Request}'
          })
        )
      }); void(0);`

      webViewRef.current?.injectJavaScript(run)
    }
    v2exMessage.login = arg => {
      const run = `(function() {
        const form = document.querySelector('form[action="/signin"]');
        const inputEls = Array.prototype.filter.call(form.elements, function(el){
            return el.classList.contains('sl')
        });
        inputEls[0].value = '${arg.username}';
        inputEls[1].value = '${arg.password}';
        if (inputEls[2]) {
            inputEls[2].value = '${arg.code}';
        }
        form.submit();
      }()); void(0);`

      webViewRef.current?.injectJavaScript(run)

      isLogining = true

      return new Promise<void>((resolve, reject) => {
        handleResolveLogin = resolve
        handleRejectLogin = reject
      }).finally(() => {
        isLogining = false
      })
    }

    v2exMessage.isLimitLogin = async () => {
      uri = `${baseURL}/signin`
      await v2exMessage.reloadWebview()

      webViewRef.current?.injectJavaScript(`
      ReactNativeWebView.postMessage(
        JSON.stringify({
          type: '${ActionType.IsLimitLogin}',
          is_limit: $('form[action="/signin"]').length
          ? !$('#captcha-image').attr('src')
          : false
        })
      ); void(0);
    `)

      return timeout(
        new Promise<boolean>(ok => (handleIsLimitLogin = ok)),
        5000
      )
    }
  }, [])

  return (
    <View style={tw`absolute w-0 h-0`} pointerEvents="none">
      <WebView
        key={forceRenderKey}
        ref={webViewRef}
        source={{
          uri,
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

            case ActionType.IsLimitLogin: {
              console.log('is_limit', result.is_limit)

              handleIsLimitLogin(result.is_limit)
              break
            }

            case ActionType.Login: {
              console.log(result)

              switch (result.status as LoginStatus) {
                case LoginStatus['2fa']:
                  Alert.prompt(
                    '你的账号已开启两步验证，请输入验证码',
                    undefined,
                    async val => {
                      webViewRef.current?.injectJavaScript(
                        get2FASubmitCode(val)
                      )
                    }
                  )
                  break
                case LoginStatus.success:
                  uri = baseURL
                  handleResolveLogin()
                  break
                case LoginStatus.error: {
                  if (result.wrongPath) {
                    webViewRef.current?.injectJavaScript(
                      `window.location = '/signin'`
                    )
                  }
                  handleRejectLogin(new Error(result.payload))
                  break
                }

                default:
                  break
              }
              break
            }
          }
        }}
        onLoad={() => {
          if (isLogining) {
            webViewRef.current?.injectJavaScript(checkSubmitStatus)
          } else {
            webViewRef.current?.injectJavaScript(`
            (function() {
              if ($('#otp_code').length) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: '${LoginStatus['2fa']}',
                  type: '${ActionType.Login}',
                }));
                return;
              }
            }()); void(0);
            `)
          }
        }}
        contentMode="desktop"
        userAgent={Platform.OS === 'android' ? userAgent : undefined}
      />
    </View>
  )
}
