import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { QueryClientProvider } from '@tanstack/react-query'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { Provider, useAtom, useAtomValue } from 'jotai'
import { waitForAll } from 'jotai/utils'
import { ReactElement, ReactNode, Suspense, useMemo } from 'react'
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
import { fontScaleAtom } from './jotai/fontSacleAtom'
import { imageViewerAtom } from './jotai/imageViewerAtom'
import { imgurConfigAtom } from './jotai/imgurConfigAtom'
import { profileAtom } from './jotai/profileAtom'
import { sov2exArgsAtom } from './jotai/sov2exArgsAtom'
import { store } from './jotai/store'
import { colorSchemeAtom } from './jotai/themeAtom'
import { topicDraftAtom } from './jotai/topicDraftAtom'
import Navigation from './navigation'
import { memberService } from './servicies/member'
import { nodeService } from './servicies/node'
import './utils/dayjsPlugins'
// import { enabledNetworkInspect } from './utils/enabledNetworkInspect'
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
                </AppInitializer>
              </AsyncStoragePersist>
            </Suspense>
          </QueryClientProvider>
          <StyledToast />
        </SafeAreaProvider>
      </Provider>
    </ActionSheetProvider>
  )
}

function AppInitializer({ children }: { children: ReactNode }) {
  const [colorScheme, profile, enabledAutoCheckin] = useAtomValue(
    waitForAll([
      colorSchemeAtom,
      profileAtom,
      enabledAutoCheckinAtom,
      enabledMsgPushAtom,
      fontScaleAtom,
      enabledParseContentAtom,
      imgurConfigAtom,
      topicDraftAtom,
      deviceTypeAtom,
      sov2exArgsAtom,
      baseUrlAtom,
    ])
  )

  useMemo(() => {
    tw.setColorScheme(colorScheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  nodeService.all.useQuery()

  useDeviceContext(tw, { withDeviceColorScheme: false })

  memberService.checkin.useQuery({
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
