import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import { focusManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StatusBar } from 'expo-status-bar'
import { Provider, useAtom, useAtomValue } from 'jotai'
import { waitForAll } from 'jotai/utils'
import { Fragment, ReactNode, Suspense, useMemo } from 'react'
import { AppStateStatus, LogBox, Platform } from 'react-native'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { useDeviceContext } from 'twrnc'

import '@/utils/dayjsPlugins'

import StyledImageViewer from './components/StyledImageViewer'
import StyledToast from './components/StyledToast'
import V2exWebview from './components/V2exWebview'
import { enabledAutoCheckinAtom } from './jotai/enabledAutoCheckinAtom'
import { enabledMsgPushAtom } from './jotai/enabledMsgPushAtom'
import { enabledPerformanceAtom } from './jotai/enabledPerformanceAtom'
import { imageViewerAtom } from './jotai/imageViewerAtom'
import { profileAtom } from './jotai/profileAtom'
import { store } from './jotai/store'
import { colorSchemeAtom } from './jotai/themeAtom'
import Navigation from './navigation'
import { useCheckin } from './servicies/member'
import { useNodes } from './servicies/node'
import './utils/dayjsPlugins'
import { enabledNetworkInspect } from './utils/enabledNetworkInspect'
import { asyncStoragePersister, queryClient } from './utils/query'
import tw from './utils/tw'
import { useAppState } from './utils/useAppState'

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending',
])

enabledNetworkInspect()

function onAppStateChange(status: AppStateStatus) {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

export default function AppWithProvider() {
  return (
    <ActionSheetProvider>
      <Provider unstable_createStore={() => store}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <Suspense>
            <AppWithJotai>
              <App />
            </AppWithJotai>
          </Suspense>

          <StyledToast />
        </PersistQueryClientProvider>
      </Provider>
    </ActionSheetProvider>
  )
}

function AppWithJotai({ children }: { children: ReactNode }) {
  const [colorScheme, profile, enabledAutoCheckin, enabledPerformance] =
    useAtomValue(
      waitForAll([
        colorSchemeAtom,
        profileAtom,
        enabledAutoCheckinAtom,
        enabledPerformanceAtom,
        enabledMsgPushAtom,
      ])
    )

  useMemo(() => {
    tw.setColorScheme(colorScheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDeviceContext(tw, { withDeviceColorScheme: false })

  useCheckin({
    onSuccess(amount = 0) {
      if (amount > 0) {
        Toast.show({
          type: 'success',
          text1: `自动签到成功`,
          text2: `已领取 ${amount} 铜币`,
        })
      }
    },
    enabled: !!profile && enabledAutoCheckin,
  })

  useNodes()

  return (
    <Fragment>
      {!enabledPerformance && <V2exWebview />}
      {children}
    </Fragment>
  )
}

function App() {
  useAppState(onAppStateChange)

  return (
    <SafeAreaProvider>
      <Navigation />
      <StatusBar />
      <GlobalImageViewer />
    </SafeAreaProvider>
  )
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
