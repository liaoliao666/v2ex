import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import { HydrationBoundary, dehydrate, useQueryClient } from 'quaere'
import { ReactNode, useEffect } from 'react'

import { isReadyNavigationPromise } from '@/navigation'
import { use } from '@/utils/use'

const getAppCachePromise = AsyncStorage.getItem('app-cache')
  .then(cache => JSON.parse(cache ?? 'null'))
  .catch(() => null)

export function AsyncStoragePersist({ children }: { children: ReactNode }) {
  const appCache = use(getAppCachePromise)
  const queryClient = useQueryClient()

  useEffect(() => {
    isReadyNavigationPromise.then(SplashScreen.hideAsync)

    const timer = setInterval(() => {
      AsyncStorage.setItem('app-cache', JSON.stringify(dehydrate(queryClient)))
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [queryClient])

  return <HydrationBoundary state={appCache}>{children}</HydrationBoundary>
}
