import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  HydrationBoundary,
  dehydrate,
  useQueryClient,
} from '@tanstack/react-query'
import { ReactNode, useEffect } from 'react'
import { suspend } from 'suspend-react'

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
    let changed = false
    let running = false

    const unsubscribe = queryClient.getQueryCache().subscribe(({ type }) => {
      if (!type.startsWith(`observer`)) {
        changed = true
      }
    })

    const timer = setInterval(async () => {
      if (changed && !running) {
        try {
          changed = false
          running = true
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
              dehydrate(queryClient, {
                shouldDehydrateQuery: query =>
                  query.state.status === 'success' &&
                  !query.isStaleByTime(1000 * 60 * 60 * 24),
              })
            )
          )
        } catch {
        } finally {
          running = false
        }
      }
    }, 1000)

    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [queryClient])

  return <HydrationBoundary state={appCache}>{children}</HydrationBoundary>
}
