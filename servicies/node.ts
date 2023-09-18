import { load } from 'cheerio'
import { mutation, query, queryWithInfinite } from 'quaere'

import { invoke } from '@/utils/invoke'
import { request } from '@/utils/request'
import { getURLSearchParams } from '@/utils/url'

import {
  getNextPageParam,
  parseLastPage,
  parseTopicItems,
  pasreArgByATag,
} from './helper'
import { Node, PageData, Topic } from './types'

export const nodesQuery = query<Node[], void>({
  key: 'nodes',
  fetcher: (_, { signal }) =>
    request.get(`/api/nodes/all.json`, { signal }).then(res => res.data),
})

export const likeNodeMutation = mutation<
  void,
  { id: number; once: string; type: 'unfavorite' | 'favorite' }
>({
  fetcher: ({ id, once, type: type }) =>
    request.get(`/${type}/node/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const nodeTopicsQuery = queryWithInfinite<
  PageData<Topic> & { liked?: boolean; once?: string },
  { name: string }
>({
  key: 'nodeTopics',
  fetcher: async ({ name }, { pageParam, signal }) => {
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
})

export const myNodesQuery = query<string[], void>({
  key: 'myNodes',
  fetcher: async (_, { signal }) => {
    const { data } = await request.get(`/my/nodes`, { signal })
    const $ = load(data)
    return $('#my-nodes a')
      .map((i, a) => pasreArgByATag($(a), 'go'))
      .get()
  },
})
