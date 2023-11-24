import { RouteProp, useRoute } from '@react-navigation/native'
import { load } from 'cheerio'
import { useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import StyledBlurView from '@/components/StyledBlurView'
import { navigation } from '@/navigation/navigationRef'
import { RootStackParamList } from '@/types'
import { queryClient } from '@/utils/query'
import { request } from '@/utils/request'
import tw from '@/utils/tw'
import { getBaseURL } from '@/utils/url'

export default function WebSigninScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'WebSignin'>>()

  const [isLoading, setIsLoading] = useState(true)

  const [webviewVisible, setWebviewVisible] = useState(true)

  const webViewRef = useRef<WebView>(null)

  const isGobackRef = useRef(false)

  function goBackWithRefetch() {
    if (isGobackRef.current) return
    isGobackRef.current = true
    navigation.pop(2)
    queryClient.refetchQueries({ type: 'active' })
  }

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      {isLoading && <LoadingIndicator style={{ paddingTop: navbarHeight }} />}

      {webviewVisible && (
        <View style={tw.style(isLoading ? `h-0` : `flex-1`)}>
          <WebView
            ref={webViewRef}
            // originWhitelist={['*']}
            onLoadEnd={() => {
              setIsLoading(false)
            }}
            style={tw.style(`flex-1`, {
              marginTop: navbarHeight,
            })}
            source={{ uri: `${getBaseURL()}/signin` }}
            // source={{ uri: `${baseURL}/signin` }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            decelerationRate="normal"
            sharedCookiesEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            // cacheEnabled={false}
            // cacheMode="LOAD_NO_CACHE"
            // incognito={true}
            renderLoading={() => <View />}
            onNavigationStateChange={async state => {
              if (state.url.startsWith(`${getBaseURL()}/auth/google?code`)) {
                setIsLoading(true)
                setWebviewVisible(false)

                const { data } = await request.get(state.url, {
                  headers: {
                    Referer: `https://accounts.google.com/`,
                  },
                })

                const $ = load(data)

                if ($('#otp_code').length) {
                  params.onTwoStepOnce($("input[name='once']").attr('value')!)
                  navigation.goBack()
                } else {
                  goBackWithRefetch()
                }
              }
            }}
            onLoad={() => {
              webViewRef.current?.injectJavaScript(
                `ReactNativeWebView.postMessage($('#menu-body > div:last > a').attr("href").includes("signout"))`
              )
            }}
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
        </View>
      )}

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          title="网页登录"
          style={tw`border-b border-solid border-divider`}
        />
      </View>
    </View>
  )
}
