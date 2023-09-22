import NetInfo from '@react-native-community/netinfo'
import { isArray, isObjectLike, pick } from 'lodash-es'
import { focusManager, onlineManager } from 'quaere'
import { UseInfiniteQueryOptions, createQueryClient } from 'quaere'
import { useMemo } from 'react'
import { AppState, Platform } from 'react-native'

export const queryClient = createQueryClient({
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

export const useRemoveUnnecessaryPages = (
  options: UseInfiniteQueryOptions<any, any, any>
) => {
  useMemo(() => {
    queryClient
      .getQueryCache()
      .findAll(pick(options, ['query', 'variables']))
      .forEach(query => {
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
            pages: [data.pages[0]],
            pageParams: [data.pageParams[0]],
          })
        }
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
