import AsyncStorage from '@react-native-async-storage/async-storage'
import { HydrationBoundary, dehydrate, useQueryClient } from 'quaere'
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
    let lastTime = 0
    let running = false

    const timer = setInterval(async () => {
      const { lastUpdated } = queryClient.getQueryCache()

      if (lastUpdated !== lastTime && !running) {
        try {
          lastTime = lastUpdated
          running = true
          await AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify(
              dehydrate(queryClient, {
                shouldDehydrateQuery: queryInfo =>
                  queryInfo.state.status === 'success' &&
                  !queryInfo.isStaleByTime(1000 * 60 * 60 * 24),
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
      clearTimeout(timer)
    }
  }, [queryClient])

  return <HydrationBoundary state={appCache}>{children}</HydrationBoundary>
}
