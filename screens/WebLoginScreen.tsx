import { useRef, useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  checkIsLoginedScript,
  webviewUserAgent,
} from '@/components/V2exWebview/helper'
import { getNavigation } from '@/navigation/navigationRef'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import useUnmount from '@/utils/useUnmount'

export default function WebLoginScreen() {
  const [isLoading, setIsLoading] = useState(true)

  const webViewRef = useRef<WebView>(null)

  useUnmount(() => {
    webViewRef.current?.clearCache?.(true)
  })

  return (
    <View style={tw`flex-1`}>
      <NavBar title="登录" />

      {isLoading && <LoadingIndicator />}

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        onLoadEnd={() => {
          setIsLoading(false)
        }}
        style={tw.style(`flex-1`, isLoading && `hidden`)}
        source={{ uri: `${baseURL}/signin` }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        injectedJavaScript={checkIsLoginedScript}
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
        // userAgent={}
        userAgent={webviewUserAgent}
      />
    </View>
  )
}
