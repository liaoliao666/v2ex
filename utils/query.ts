import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient, focusManager } from '@tanstack/react-query'
import { isArray, isObjectLike } from 'lodash-es'
import { AppState, Platform } from 'react-native'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
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

export function removeUnnecessaryPages(queryKey?: unknown[]) {
  queryClient
    .getQueryCache()
    .findAll({ queryKey })
    .forEach(query => {
      const data: any = query.state.data
      const isInfiniteQuery =
        isObjectLike(data) && isArray(data.pages) && isArray(data.pageParams)
      if (
        isInfiniteQuery &&
        query.state.status === 'success' &&
        data.pages.length >= 2
      ) {
        query.setData({
          pages: [data.pages[0]],
          pageParams: [data.pageParams[0]],
        })
      }
    })
}
