import { isArray, isObjectLike, pick } from 'lodash-es'
import { focusManager } from 'quaere'
import { UseInfiniteQueryOptions, createQueryClient } from 'quaere'
import { useMemo } from 'react'
import { AppState, Platform } from 'react-native'

export const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

AppState.addEventListener('change', status => {
  // React Query already supports in web browser refetch on window focus by default
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
})

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
