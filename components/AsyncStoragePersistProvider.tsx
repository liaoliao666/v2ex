import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import { HydrationBoundary, dehydrate, useQueryClient } from 'quaere'
import { ReactNode, useEffect } from 'react'

import { isReadyNavigation } from '@/navigation'

const appCachePromise = AsyncStorage.getItem('app-cache')

export function AsyncStoragePersistProvider({
  children,
}: {
  children: ReactNode
}) {
  const appCache = use(appCachePromise)
  const queryClient = useQueryClient()

  useEffect(() => {
    isReadyNavigation.then(SplashScreen.hideAsync)

    const timer = setInterval(() => {
      AsyncStorage.setItem('app-cache', JSON.stringify(dehydrate(queryClient)))
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [queryClient])

  return <HydrationBoundary state={appCache}>{children}</HydrationBoundary>
}

function use<T>(
  promise: Promise<T> & {
    status?: 'pending' | 'fulfilled' | 'rejected'
    value?: T
    reason?: unknown
  }
): T {
  if (promise.status === 'pending') {
    throw promise
  } else if (promise.status === 'fulfilled') {
    return promise.value as T
  } else if (promise.status === 'rejected') {
    throw promise.reason
  } else {
    promise.status = 'pending'
    promise.then(
      v => {
        promise.status = 'fulfilled'
        promise.value = v
      },
      e => {
        promise.status = 'rejected'
        promise.reason = e
      }
    )
    throw promise
  }
}
