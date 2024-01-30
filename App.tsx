import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
// import { enabledNetworkInspect } from './utils/enabledNetworkInspect'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { Provider, useAtom, useAtomValue } from 'jotai'
import { waitForAll } from 'jotai/utils'
import { ReactElement, ReactNode, Suspense } from 'react'
import { LogBox } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useDeviceContext } from 'twrnc'

import { AsyncStoragePersist } from './components/AsyncStoragePersist'
import StyledImageViewer from './components/StyledImageViewer'
import StyledToast from './components/StyledToast'
import { baseUrlAtom } from './jotai/baseUrlAtom'
import { deviceTypeAtom } from './jotai/deviceTypeAtom'
import { enabledAutoCheckinAtom } from './jotai/enabledAutoCheckinAtom'
import { enabledMsgPushAtom } from './jotai/enabledMsgPushAtom'
import { enabledParseContentAtom } from './jotai/enabledParseContent'
import { imageViewerAtom } from './jotai/imageViewerAtom'
import { imgurConfigAtom } from './jotai/imgurConfigAtom'
import { profileAtom } from './jotai/profileAtom'
import { sov2exArgsAtom } from './jotai/sov2exArgsAtom'
import { store } from './jotai/store'
import { colorSchemeAtom } from './jotai/themeAtom'
import { topicDraftAtom } from './jotai/topicDraftAtom'
import { colorsAtom, fontScaleAtom, themeNameAtom } from './jotai/uiAtom'
import Navigation from './navigation'
import { k } from './servicies'
import './utils/dayjsPlugins'
import { queryClient } from './utils/query'
import tw from './utils/tw'

SplashScreen.preventAutoHideAsync()

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
  const [profile, enabledAutoCheckin] = useAtomValue(
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
    ])
  )

  k.member.checkin.useQuery({
    enabled: !!profile && enabledAutoCheckin,
  })

  k.node.all.useQuery()

  useDeviceContext(tw, { withDeviceColorScheme: false })

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
