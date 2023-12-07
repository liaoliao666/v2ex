import { load } from 'cheerio'
import { router } from 'react-query-kit'

import { invoke } from '@/utils/invoke'
import { removeUnnecessaryPages } from '@/utils/query'
import { request } from '@/utils/request'
import { getURLSearchParams } from '@/utils/url'

import { getNextPageParam, parseLastPage, parseTopicItems } from './helper'
import { Node, PageData, Topic } from './types'

export const nodeService = router(`node`, {
  all: router.query({
    fetcher: (_, { signal }): Promise<Node[]> =>
      request.get(`/api/nodes/all.json`, { signal }).then(res => res.data),
  }),

  topics: router.infiniteQuery({
    fetcher: async (
      { name }: { name: string },
      { pageParam, signal }
    ): Promise<PageData<Topic> & { liked?: boolean; once?: string }> => {
      const { data } = await request.get(`/go/${name}?p=${pageParam}`, {
        responseType: 'text',
        signal,
      })
      const $ = load(data)

      return {
        page: pageParam,
        last_page: parseLastPage($),
        list: parseTopicItems($, '#TopicsNode .cell'),
        ...invoke(() => {
          const url = $('.cell_ops a').attr('href')
          if (!url) return
          return {
            once: getURLSearchParams(url).once,
            liked: url.includes('unfavorite'),
          }
        }),
      }
    },
    initialPageParam: 1,
    getNextPageParam,
    structuralSharing: false,
    use: [removeUnnecessaryPages],
  }),

  like: router.mutation({
    mutationFn: ({
      id,
      once,
      type,
    }: {
      id: number
      once: string
      type: 'unfavorite' | 'favorite'
    }) =>
      request.get(`/${type}/node/${id}?once=${once}`, {
        responseType: 'text',
      }),
  }),
})
