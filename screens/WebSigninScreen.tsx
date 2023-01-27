import { useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import StyledBlurView from '@/components/StyledBlurView'
import { getNavigation } from '@/navigation/navigationRef'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import useUnmount from '@/utils/useUnmount'

export default function WebSigninScreen() {
  const [isLoading, setIsLoading] = useState(true)

  const webViewRef = useRef<WebView>(null)

  useUnmount(() => {
    webViewRef.current?.clearCache?.(true)
  })

  const isGobackRef = useRef(false)

  function goBackWithRefetch() {
    if (isGobackRef.current) return
    isGobackRef.current = true
    // v2exMessage.reloadWebview()
    getNavigation()?.pop(2)
    queryClient.refetchQueries({ type: 'active' })
  }

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      {isLoading && <LoadingIndicator style={{ paddingTop: navbarHeight }} />}

      <WebView
        ref={webViewRef}
        // originWhitelist={['*']}
        onLoadEnd={() => {
          setIsLoading(false)
        }}
        style={tw.style(`flex-1`, isLoading && `hidden`, {
          marginTop: navbarHeight,
        })}
        source={{ uri: `${baseURL}/signin` }}
        // source={{ uri: `${baseURL}/signin` }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        injectedJavaScript={`ReactNativeWebView.postMessage($('#menu-body > div:last > a').attr("href").includes("signout"))`}
        scalesPageToFit={true}
        // cacheEnabled={false}
        // cacheMode="LOAD_NO_CACHE"
        // incognito={true}
        renderLoading={() => <View />}
        // onNavigationStateChange={async state => {
        //   if (state.url.startsWith(`${baseURL}/auth/google?code`)) {
        //     setIsLoading(true)
        //     setWebviewVisible(false)

        //     const { data } = await request.get(state.url, {
        //       headers: {
        //         Referer: `https://accounts.google.com/`,
        //       },
        //     })

        //     const $ = load(data)

        //     if ($('#otp_code').length) {
        //       params.onTwoStepOnce($("input[name='once']").attr('value')!)
        //       getNavigation()?.goBack()
        //     } else {
        //       goBackWithRefetch()
        //     }
        //   }
        // }}
        onMessage={async event => {
          const isSignin = event.nativeEvent.data

          if (isSignin === 'true') {
            goBackWithRefetch()
          }
        }}
        userAgent={
          Platform.OS === 'android'
            ? `Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36`
            : `Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`
        }
      />

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="网页登录" />
      </View>
    </View>
  )
}
