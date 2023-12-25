import { load } from 'cheerio'
import dayjs from 'dayjs'
import { isArray, isEqual, isString, noop, pick } from 'lodash-es'
import { router } from 'react-query-kit'

import { removeUnnecessaryPages } from '@/utils/query'
import { request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

import {
  getNextPageParam,
  parseLastPage,
  parseTopic,
  parseTopicItems,
} from './helper'
import { PageData, Topic } from './types'

export const topic = router(`topic`, {
  preview: router.query<
    string,
    {
      text: string
      syntax: 'default' | 'markdown'
    }
  >({
    fetcher: async ({ text, syntax }, { signal }) => {
      const { data } = await request.post(
        `/preview/${syntax}`,
        paramsSerializer({ text }),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          signal,
          responseType: 'text',
        }
      )
      return data
    },
    gcTime: 10 * 60 * 10,
    staleTime: 10 * 60 * 10,
  }),

  tab: router.query<Topic[], { tab?: string }>({
    fetcher: async ({ tab }, { signal }) => {
      const { data } = await request.get(
        tab === 'changes' ? '/changes' : `?tab=${tab}`,
        {
          responseType: 'text',
          signal,
        }
      )
      const $ = load(data)
      return parseTopicItems($, '#Main .box .cell.item')
    },
    structuralSharing: false,
    staleTime: 10 * 1000,
  }),

  hotest: router.query<Topic[], { tab: string }>({
    fetcher: async ({ tab }, { signal }) => {
      const { data } = await request.get(
        `https://v2hot.pipecraft.net/hot/${tab}`,
        {
          responseType: 'text',
          signal,
        }
      )
      const $ = load(data)
      return parseTopicItems($, '#Main .box .cell.item')
    },
    structuralSharing: false,
    staleTime: 10 * 1000,
  }),

  recent: router.infiniteQuery<PageData<Topic>>({
    fetcher: async (_, { pageParam, signal }) => {
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
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 10 * 1000,
    structuralSharing: false,
    use: [removeUnnecessaryPages],
  }),

  byId: router.query<Topic, { id: number }>({
    fetcher: async ({ id }, { signal }) => {
      const { data } = await request.get(`/api/topics/show.json?id=${id}`, {
        signal,
      })
      const item = (isArray(data) ? data[0] || {} : {}) as any
      if (item.member) {
        item.member.avatar = item.member.avatar_large
      }
      if (item.node) {
        item.node.avatar = item.node.avatar_large
      }
      if (item.last_touched) {
        item.last_touched = dayjs.unix(item.last_touched).fromNow()
      }
      return item as Topic
    },
  }),

  detail: router.infiniteQuery<
    Topic & { page: number; last_page: number; image_count: number },
    { id: number }
  >({
    fetcher: async ({ id }, { pageParam, signal }) => {
      const { data } = await request.get(`/t/${id}?p=${pageParam}`, {
        responseType: 'text',
        signal,
      })

      const $ = load(data)

      const topicDetail = {
        page: pageParam,
        last_page: parseLastPage($),
        id,
        image_count: $('#Main .embedded_image').length,
        ...parseTopic($),
      }

      if (!topicDetail.title) throw new Error('Something went wrong')

      return topicDetail
    },
    initialPageParam: 1,
    getNextPageParam,
    structuralSharing: false,
    use: [removeUnnecessaryPages],
  }),

  deleteNotification: router.mutation({
    mutationFn: ({ id, once }: { id: number; once: string }) =>
      request.post(`/delete/notification/${id}?once=${once}`, {
        responseType: 'text',
      }),
  }),

  like: router.mutation<
    void,
    { id: number; once: string; type: 'unfavorite' | 'favorite' }
  >({
    mutationFn: ({ id, once, type }) =>
      request.get(`/${type}/topic/${id}?once=${once}`, {
        responseType: 'text',
      }),
  }),

  thank: router.mutation<void, { id: number; once: string }>({
    mutationFn: ({ id, once }) =>
      request.post(`/thank/topic/${id}?once=${once}`),
  }),

  vote: router.mutation<
    number,
    { id: number; once: string; type: 'up' | 'down' }
  >({
    mutationFn: async ({ id, once, type: type }) => {
      const { data } = await request.post(`/${type}/topic/${id}?once=${once}`)
      if (typeof data !== 'object' || !isString(data.html))
        return Promise.reject()
      const $ = load(data.html as string)
      const votes = parseInt($('.vote').eq(0).text().trim(), 10)

      return votes
    },
  }),

  reply: router.mutation<
    void,
    { content: string; once: string; topicId: number }
  >({
    mutationFn: ({ topicId, ...args }) =>
      request.post(`/t/${topicId}`, paramsSerializer(args), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
  }),

  write: router.mutation<
    void,
    {
      title: string
      content?: string
      node_name: string
      syntax: 'default' | 'markdown'
      once: string
    }
  >({
    mutationFn: args =>
      request.post(`/write`, paramsSerializer(args), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
  }),

  editInfo: router.query<
    { content: string; syntax: 'default' | 'markdown' },
    { id: number }
  >({
    fetcher: async ({ id }, { signal }) => {
      const { data } = await request.get<string>(`/edit/topic/${id}`, {
        responseType: 'text',
        signal,
      })
      const $ = load(data)

      return {
        content: $('#topic_content').text(),
        syntax:
          $('#select_syntax option:selected').text() === 'Default'
            ? 'default'
            : 'markdown',
      }
    },
    gcTime: 0,
    staleTime: 0,
  }),

  edit: router.mutation<
    void,
    {
      title: string
      content?: string
      node_name: string
      syntax: 0 | 1
      prevTopic: Topic
    }
  >({
    mutationFn: async ({ prevTopic, ...args }) => {
      const promises = []

      if (args.node_name !== prevTopic.node?.name) {
        promises.push(
          request.post(
            `/move/topic/${prevTopic.id}`,
            paramsSerializer({
              destination: args.node_name,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          )
        )
      }

      const keys = ['title', 'content', 'syntax']
      if (!isEqual(pick(prevTopic, keys), pick(args, keys))) {
        promises.push(
          request.post(
            `/edit/topic/${prevTopic.id}`,
            paramsSerializer(pick(args, keys)),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          )
        )
      }

      return Promise.all(promises).then(noop)
    },
  }),

  append: router.mutation<
    void,
    {
      content?: string
      once: string
      topicId: number
    }
  >({
    mutationFn: ({ topicId, ...args }) =>
      request.post(
        `/append/topic/${topicId}`,
        paramsSerializer({
          ...args,
          syntax: 'default',
        }),
        {
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
        }
      ),
  }),

  ignore: router.mutation<
    void,
    { id: number; once: string; type: 'ignore' | 'unignore' }
  >({
    mutationFn: ({ id, once, type }) =>
      request.get(`/${type}/topic/${id}?once=${once}`),
  }),

  report: router.mutation<void, { id: number; once: string }>({
    mutationFn: ({ id, once }) =>
      request.get(`/report/topic/${id}?once=${once}`),
  }),
})
