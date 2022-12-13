import { load } from 'cheerio'
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
} from 'react-query-kit'

import { invoke } from '@/utils/invoke'
import { request } from '@/utils/request'
import { getURLSearchParams } from '@/utils/url'

import { getNextPageParam, parseLastPage, parseTopicItems } from './helper'
import { Node, PageData, Topic } from './types'

export const useNodes = createQuery<Node[]>('useNodes', ({ signal }) =>
  request.get(`/api/nodes/all.json`, { signal }).then(res => res.data)
)

export const useLikeNode = createMutation<
  void,
  { id: number; once: string; type: 'unfavorite' | 'favorite' }
>(({ id, once, type: type }) =>
  request.get(`/${type}/node/${id}?once=${once}`, {
    responseType: 'text',
  })
)

export const useNodeTopics = createInfiniteQuery<
  PageData<Topic> & { liked?: boolean; once?: string },
  { name: string }
>(
  'useNodeTopics',
  async ({ queryKey: [_, { name }], pageParam = 1, signal }) => {
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
  {
    getNextPageParam,
  }
)

export const useMyNodes = createQuery<string[]>(
  'useMyNodes',
  async ({ signal }) => {
    const { data } = await request.get(`/my/nodes`, { signal })
    const $ = load(data)
    return $('#my-nodes a')
      .map((i, a) => $(a).attr('href')?.replace('/go/', '').trim()!)
      .get()
  }
)
