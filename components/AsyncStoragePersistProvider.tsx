import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import { HydrationBoundary, dehydrate, useQueryClient } from 'quaere'
import { ReactNode, useEffect } from 'react'
import { suspend } from 'suspend-react'

import { isReadyNavigationPromise } from '@/navigation'

const CACHE_KEY = 'app-cache'

export function AsyncStoragePersist({ children }: { children: ReactNode }) {
  const appCache = suspend(
    () =>
      AsyncStorage.getItem(CACHE_KEY)
        .then(cache => JSON.parse(cache ?? 'null'))
        .catch(() => null),
    [CACHE_KEY]
  )
  const queryClient = useQueryClient()

  useEffect(() => {
    isReadyNavigationPromise.then(SplashScreen.hideAsync)

    const timer = setInterval(() => {
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(dehydrate(queryClient)))
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [queryClient])

  return <HydrationBoundary state={appCache}>{children}</HydrationBoundary>
}
