import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { BackHandler, Platform, View } from 'react-native'
import WebView from 'react-native-webview'

import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import StyledButton from '@/components/StyledButton'
import { uiAtom } from '@/jotai/uiAtom'
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

  const urlRef = useRef(params.url)

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

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        handlebackpressed
      )

      return () => {
        subscription.remove()
      }
    }
  }, []) // initialize only once

  const { colors } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar
        style={tw`border-b border-solid border-[${colors.divider}]`}
        title={isLoading ? '跳转中...' : title || 'Browse'}
        left={
          <IconButton
            onPress={() => {
              navigation.goBack()
            }}
            name="close"
            size={24}
            color={colors.foreground}
            activeColor={colors.foreground}
          />
        }
        right={
          <StyledButton
            shape="rounded"
            onPress={() => {
              openURL(urlRef.current)
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
          urlRef.current = ev.url
          setTitle(ev.title)
        }}
        source={{ uri: params.url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate={0.998}
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures
        injectedJavaScript={getTitleScript}
        onMessage={({ nativeEvent }) => {
          setTitle(nativeEvent.data)
        }}
        renderLoading={() => (
          <LoadingIndicator
            style={tw`absolute w-full h-full bg-[${colors.base100}]`}
          />
        )}
      />
    </View>
  )
}
