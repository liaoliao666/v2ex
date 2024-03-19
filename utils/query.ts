import NetInfo from '@react-native-community/netinfo'
import {
  QueryClient,
  focusManager,
  hashKey,
  onlineManager,
} from '@tanstack/react-query'
import { first, isArray, isObjectLike } from 'lodash-es'
import { useMemo } from 'react'
import { AppState, Platform } from 'react-native'
import { InfiniteQueryHook, Middleware, getKey } from 'react-query-kit'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'offlineFirst' },
  },
})

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', status => {
    focusManager.setFocused(status === 'active')
  })

  NetInfo.addEventListener(state => {
    onlineManager.setOnline(
      state.isConnected != null &&
        state.isConnected &&
        Boolean(state.isInternetReachable)
    )
  })
}

export const removeUnnecessaryPages: Middleware<
  InfiniteQueryHook<any, any, any, any>
> = useNext => options => {
  useMemo(() => {
    if (options.enabled !== false && !!options.getNextPageParam) {
      const query = queryClient
        .getQueryCache()
        .get(hashKey(getKey(options.queryKey, options.variables)))

      if (!query) return

      const data: any = query.state.data
      const isInfiniteQuery =
        isObjectLike(data) && isArray(data.pages) && isArray(data.pageParams)

      if (
        isInfiniteQuery &&
        query.state.status === 'success' &&
        data.pages.length >= 2
      ) {
        // only keep one page before mount
        query.setData({
          pages: [first(data.pages)],
          pageParams: [first(data.pageParams)],
        })
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useNext(options)
}
