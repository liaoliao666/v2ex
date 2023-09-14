import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient, focusManager } from '@tanstack/react-query'
import { isArray, isObjectLike, isUndefined } from 'lodash-es'
import { useMemo } from 'react'
import { AppState, Platform } from 'react-native'
import { InfiniteQueryHook, Middleware, getKey } from 'react-query-kit'

const removeUnnecessaryPages: Middleware<InfiniteQueryHook> =
  useQueryNext => (options, client) => {
    useMemo(() => {
      const isValidInfiniteQuery =
        !isUndefined(options.getNextPageParam) && options.enabled !== false

      if (isValidInfiniteQuery) {
        queryClient
          .getQueryCache()
          .findAll({ queryKey: getKey(options.primaryKey, options.variables) })
          .forEach(query => {
            const data: any = query.state.data
            const isInfiniteQuery =
              isObjectLike(data) &&
              isArray(data.pages) &&
              isArray(data.pageParams)
            if (
              isInfiniteQuery &&
              query.state.status === 'success' &&
              data.pages.length >= 2
            ) {
              // only keep one page before mount
              query.setData({
                pages: [data.pages[0]],
                pageParams: [data.pageParams[0]],
              })
            }
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
