import { RouteProp, useRoute } from '@react-navigation/native'
import { useEffect, useRef, useState } from 'react'
import { BackHandler, Platform, View } from 'react-native'
import WebView from 'react-native-webview'

import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import StyledButton from '@/components/StyledButton'
import { navigation } from '@/navigation/navigationRef'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

const getTitleScript = `
    let _documentTitle = document.title;
    window.ReactNativeWebView.postMessage(_documentTitle)
    Object.defineProperty(document, 'title', {
      set (val) {
        _documentTitle = val
        window.ReactNativeWebView.postMessage(_documentTitle)
      },
      get () {
        return _documentTitle
      }
    });
  `

export default function WebviewScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Webview'>>()

  const [isLoading, setIsLoading] = useState(true)

  const webViewRef = useRef<WebView>(null)

  const [title, setTitle] = useState('')

  const canGoBackRef = useRef(false)

  useEffect(() => {
    if (Platform.OS === 'android') {
      const handlebackpressed = () => {
        if (canGoBackRef.current) {
          webViewRef.current?.goBack?.()
        } else {
          navigation.goBack()
        }
        return true
      }

      BackHandler.addEventListener('hardwareBackPress', handlebackpressed)

      return () => {
        BackHandler.addEventListener('hardwareBackPress', handlebackpressed)
      }
    }
  }, []) // initialize only once

  return (
    <View style={tw`flex-1`}>
      <NavBar
        style={tw`border-b border-solid border-divider`}
        title={isLoading ? '跳转中...' : title || 'Browse'}
        left={
          <IconButton
            onPress={() => {
              navigation.goBack()
            }}
            name="close"
            size={24}
            color={tw.color(`text-foreground`)}
            activeColor={tw.color(`text-foreground`)}
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

      <WebView
        style={tw`flex-1`}
        containerStyle={tw`relative flex-1`}
        ref={webViewRef}
        onLoadEnd={() => {
          setIsLoading(false)
        }}
        onError={() => {
          setIsLoading(false)
        }}
        onNavigationStateChange={ev => {
          canGoBackRef.current = ev.canGoBack
          setTitle(ev.title)
        }}
        source={{ uri: params.url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures
        injectedJavaScript={getTitleScript}
        onMessage={({ nativeEvent }) => {
          setTitle(nativeEvent.data)
        }}
        renderLoading={() => (
          <LoadingIndicator style={tw`absolute w-full h-full bg-background`} />
        )}
      />
    </View>
  )
}
