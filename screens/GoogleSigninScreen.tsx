import { RouteProp, useRoute } from '@react-navigation/native'
import { useRef, useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import { getNavigation } from '@/navigation/navigationRef'
import { RootStackParamList } from '@/types'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import useUnmount from '@/utils/useUnmount'

export default function GoogleSigninScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'GoogleSignin'>>()

  const [isLoading, setIsLoading] = useState(true)

  const webViewRef = useRef<WebView>(null)

  useUnmount(() => {
    webViewRef.current?.clearCache?.(true)
  })

  return (
    <View style={tw`flex-1`}>
      <NavBar title="谷歌登录" />

      {isLoading && <LoadingIndicator />}

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        onLoadEnd={() => {
          setIsLoading(false)
        }}
        style={tw.style(`flex-1`, isLoading && `hidden`)}
        source={{ uri: `${baseURL}/auth/google?once=${params.once}` }}
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
        onMessage={event => {
          const isSignin = event.nativeEvent.data

          if (isSignin === 'true') {
            getNavigation()?.pop(2)
            queryClient.refetchQueries({ type: 'active' })
          }
        }}
        userAgent={`Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`}
      />
    </View>
  )
}
