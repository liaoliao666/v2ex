import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'
import { isString } from 'twrnc/dist/esm/types'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import { cookieAtom } from '@/jotai/cookieAtom'
import { getNavigation } from '@/navigation/navigationRef'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'

const getCookiesJS = 'ReactNativeWebView.postMessage(document.cookie)'

export default function WebLoginScreen() {
  const [isLoading, setIsLoading] = useState(true)

  const setCookieAtom = useSetAtom(cookieAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar title="登录" />

      {isLoading && <LoadingIndicator />}

      <WebView
        onLoadEnd={() => {
          setIsLoading(false)
        }}
        style={tw.style(`flex-1`, isLoading && `hidden`)}
        source={{ uri: `${baseURL}/signin` }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        javaScriptEnabledAndroid={true}
        startInLoadingState={true}
        injectedJavaScript={getCookiesJS}
        scalesPageToFit={true}
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        incognito={true}
        renderLoading={() => <View />}
        onMessage={event => {
          const cookie = event.nativeEvent.data
          if (
            isString(cookie) &&
            cookie.length > 50 &&
            event.nativeEvent.url.startsWith(baseURL)
          ) {
            setCookieAtom(cookie)
            getNavigation()?.pop(2)
            queryClient.refetchQueries({ type: 'active' })
          }
        }}
        userAgent={`Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1`}
      />
    </View>
  )
}
