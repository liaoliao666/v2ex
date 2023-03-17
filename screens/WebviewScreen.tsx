import { RouteProp, useRoute } from '@react-navigation/native'
import { useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
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

  const navbarHeight = useNavBarHeight()

  const [title, setTitle] = useState('跳转中...')

  return (
    <View style={tw`flex-1`}>
      {isLoading && <LoadingIndicator style={{ paddingTop: navbarHeight }} />}

      <View style={tw.style(isLoading ? `h-0` : `flex-1`)}>
        <WebView
          onLoadEnd={() => {
            setIsLoading(false)
          }}
          onError={() => {
            setIsLoading(false)
          }}
          style={tw.style(`flex-1`, {
            marginTop: navbarHeight,
          })}
          source={{ uri: params.url }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          decelerationRate="normal"
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          renderLoading={() => <View />}
          injectedJavaScript={getTitleScript}
          onMessage={({ nativeEvent }) => {
            setTitle(nativeEvent.data)
          }}
        />
      </View>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          style={tw`border-b border-solid border-tint-border`}
          title={title}
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
      </View>
    </View>
  )
}
