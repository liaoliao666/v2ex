import { RouteProp, useRoute } from '@react-navigation/native'
import { useRef, useState } from 'react'
import { View } from 'react-native'
import WebView, { WebViewNavigation } from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { BackButton } from '@/components/NavBar'
import StyledButton from '@/components/StyledButton'
import { navigation } from '@/navigation/navigationRef'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

export default function WebviewScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Webview'>>()

  const [isLoading, setIsLoading] = useState(true)

  const webViewRef = useRef<WebView>(null)

  const [navigationState, setNavigationState] = useState<WebViewNavigation>()

  return (
    <View style={tw`flex-1`}>
      <NavBar
        style={tw`border-b border-solid border-tint-border`}
        title={isLoading ? '跳转中...' : navigationState?.title || 'Browser'}
        left={
          <BackButton
            onPress={() => {
              if (navigationState?.canGoBack) {
                webViewRef.current?.goBack()
              } else {
                navigation.goBack()
              }
            }}
          />
        }
        right={
          <StyledButton
            shape="rounded"
            onPress={() => {
              openURL(params.url)
            }}
          >
            浏览器打开
          </StyledButton>
        }
      />

      {isLoading && <LoadingIndicator />}

      <View style={tw.style(isLoading ? `h-0` : `flex-1`)}>
        <WebView
          ref={webViewRef}
          onLoadEnd={() => {
            setIsLoading(false)
          }}
          onError={() => {
            setIsLoading(false)
          }}
          onNavigationStateChange={setNavigationState}
          style={tw.style(`flex-1`)}
          source={{ uri: params.url }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          decelerationRate="normal"
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          renderLoading={() => <View />}
        />
      </View>
    </View>
  )
}
