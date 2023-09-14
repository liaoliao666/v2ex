import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient, focusManager } from '@tanstack/react-query'
import { isUndefined, pick } from 'lodash-es'
import { useMemo } from 'react'
import { AppState, Platform } from 'react-native'
import { InfiniteQueryHook, Middleware, getKey } from 'react-query-kit'

const removeUnnecessaryPages: Middleware<InfiniteQueryHook> =
  useQueryNext => (options, client) => {
    useMemo(() => {
      const isValidInfiniteQuery =
        !isUndefined(options.getNextPageParam) && options.enabled !== false

      if (isValidInfiniteQuery) {
        queryClient.prefetchInfiniteQuery({
          queryKey: getKey(options.primaryKey, options.variables),
          pages: 1,
          ...pick(options, ['queryFn', 'initialPageParam', 'getNextPageParam']),
        })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return useQueryNext(options, client)
  }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
      // @ts-ignore
      use: [removeUnnecessaryPages],
    },
  },
})

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

AppState.addEventListener('change', status => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
})
