import { load } from 'cheerio'
import { isString } from 'lodash-es'
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
} from 'react-query-kit'
import { isObject } from 'twrnc/dist/esm/types'

import { request } from '@/utils/request'

import {
  getNextPageParam,
  parseLastPage,
  parseTopic,
  parseTopicItems,
} from './helper'
import { PageData, Topic } from './types'

export const useTabTopics = createQuery<Topic[], { tab?: string }>(
  'useTabTopics',
  async ({ queryKey: [_, { tab }], signal }) => {
    const { data } = await request.get(`?tab=${tab}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)
    return parseTopicItems($, '#Main .box .cell.item')
  }
)

export const useRecentTopics = createInfiniteQuery<PageData<Topic>>(
  'useRecentTopics',
  async ({ pageParam = 1, signal }) => {
    const { data } = await request.get(`/recent?p=${pageParam}`, {
      responseType: 'text',
      signal,
    })

    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: parseTopicItems($, '#Main .box .cell.item'),
    }
  },
  {
    getNextPageParam,
  }
)

export const useTopicDetail = createInfiniteQuery<
  Topic & { page: number; last_page: number },
  { id: number }
>(
  'useTopicDetail',
  async ({ queryKey: [_, { id }], pageParam = 1, signal }) => {
    const { data } = await request.get(`/t/${id}?p=${pageParam}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      id,
      ...parseTopic($),
    }
  },
  {
    getNextPageParam,
  }
)

export const useLikeTopic = createMutation<
  void,
  { id: number; once: string; type: 'unfavorite' | 'favorite' }
>(({ id, once, type: type }) =>
  request.get(`/${type}/topic/${id}?once=${once}`, {
    responseType: 'text',
  })
)

export const useThankTopic = createMutation<void, { id: number; once: string }>(
  ({ id, once }) => request.post(`/thank/topic/${id}?once=${once}`)
)

export const useVoteTopic = createMutation<
  number,
  { id: number; once: string; type: 'up' | 'down' }
>(async ({ id, once, type: type }) => {
  const { data } = await request.post(`/${type}/topic/${id}?once=${once}`)
  if (!isObject(data) || !isString(data.html)) return Promise.reject()
  const $ = load(data.html as string)
  const votes = parseInt($('.vote').eq(0).text().trim(), 10)

  return votes
})

export const useThankReply = createMutation<void, { id: number; once: string }>(
  ({ id, once }) => request.post(`/thank/reply/${id}?once=${once}`)
)

export const useMyTopics = createInfiniteQuery<PageData<Topic>>(
  'useMyTopics',
  async ({ pageParam = 1, signal }) => {
    const { data } = await request.get(`/my/topics?p=${pageParam}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: parseTopicItems($, '#Main .box .cell.item'),
    }
  },
  {
    getNextPageParam,
  }
)

export const useReply = createMutation<
  void,
  { content: string; once: string; topicId: number }
>(({ topicId, ...args }) => {
  return request.post(
    `/t/${topicId}`,
    Object.entries(args)
      .map(([key, val]) => `${key}=${encodeURI(val)}`)
      .join('&'),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    }
  )
})

export const useWriteTopic = createMutation<
  void,
  {
    title: string
    content?: string
    node_name: string
    once: string
  }
>(args => {
  return request.post(
    `/write`,
    Object.entries({
      ...args,
      syntax: 'default',
    })
      .map(([key, val]) => `${key}=${encodeURI(val)}`)
      .join('&'),
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    }
  )
})

export const useIgnoreTopic = createMutation<
  void,
  { id: number; once: string; type: 'ignore' | 'unignore' }
>(({ id, once }) => request.post(`/ignore/topic/${id}?once=${once}`))

export const useIgnoreReply = createMutation<
  void,
  { id: number; once: string }
>(({ id, once }) => request.post(`/ignore/reply/${id}?once=${once}`))
