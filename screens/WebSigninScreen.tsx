import { useRef, useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import StyledBlurView from '@/components/StyledBlurView'
import { getNavigation } from '@/navigation/navigationRef'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'

export default function WebSigninScreen() {
  const [isLoading, setIsLoading] = useState(true)

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
        // contentMode="desktop"
      />

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="网页登录" />
      </View>
    </View>
  )
}
