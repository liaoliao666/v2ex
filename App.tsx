import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
// import { enabledNetworkInspect } from './utils/enabledNetworkInspect'
import SplashScreen from 'react-native-splash-screen'
import { StatusBar } from 'react-native'
import { Provider, useAtom, useAtomValue } from 'jotai'

import { ReactElement, ReactNode, Suspense, useEffect } from 'react'
import { LogBox } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useDeviceContext } from 'twrnc'
import { atom } from 'jotai'

import { AsyncStoragePersist } from './components/AsyncStoragePersist'
import StyledImageViewer from './components/StyledImageViewer'
import StyledToast from './components/StyledToast'
import { baseUrlAtom } from './jotai/baseUrlAtom'
import { deviceTypeAtom } from './jotai/deviceTypeAtom'
import { enabledAutoCheckinAtom } from './jotai/enabledAutoCheckinAtom'
import { enabledMsgPushAtom } from './jotai/enabledMsgPushAtom'
import { enabledParseContentAtom } from './jotai/enabledParseContent'
import { enabledWebviewAtom } from './jotai/enabledWebviewAtom'
import { imageViewerAtom } from './jotai/imageViewerAtom'
import { imgurConfigAtom } from './jotai/imgurConfigAtom'
import { profileAtom } from './jotai/profileAtom'
import { searchHistoryAtom } from './jotai/searchHistoryAtom'
import { sov2exArgsAtom } from './jotai/sov2exArgsAtom'
import { store } from './jotai/store'
import { colorSchemeAtom } from './jotai/themeAtom'
import { fontScaleAtom, themeNameAtom, colorsAtom } from './jotai/uiAtom'
import { topicDraftAtom } from './jotai/topicDraftAtom'
import Navigation from './navigation'
import { k } from './servicies'
import './utils/dayjsPlugins'
import { queryClient } from './utils/query'
import tw from './utils/tw'
import { waitForAll } from 'jotai/utils'

// SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending',
])

// enabledNetworkInspect()

export default function App() {
  return (
    <ActionSheetProvider>
      <Provider unstable_createStore={() => store}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense>
              <AsyncStoragePersist>
                <AppInitializer>
                  <Navigation />
                  <StatusBar />
                  <GlobalImageViewer />
                  <StyledToast />
                </AppInitializer>
              </AsyncStoragePersist>
            </Suspense>
          </QueryClientProvider>
        </SafeAreaProvider>
      </Provider>
    </ActionSheetProvider>
  )
}

function AppInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    console.log(`Bundle loaded`);
    SplashScreen.hide()
  }, [])

  const [profile, enabledAutoCheckin, colorScheme] = useAtomValue(
    waitForAll([
      profileAtom,
      enabledAutoCheckinAtom,
      colorSchemeAtom,
      enabledMsgPushAtom,
      fontScaleAtom,
      enabledParseContentAtom,
      imgurConfigAtom,
      topicDraftAtom,
      deviceTypeAtom,
      sov2exArgsAtom,
      baseUrlAtom,
      colorsAtom,
      themeNameAtom,
      enabledWebviewAtom,
      searchHistoryAtom,
    ])
  )

  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: colorScheme,
  })

  k.node.all.useQuery()
  k.member.checkin.useQuery({
    enabled: !!profile && enabledAutoCheckin,
  })

  return children as ReactElement
}

function GlobalImageViewer() {
  const [imageViewer, setImageViewer] = useAtom(imageViewerAtom)
  return (
    <StyledImageViewer
      {...imageViewer}
      onClose={() =>
        setImageViewer({ visible: false, index: 0, imageUrls: [] })
      }
    />
  )
}
