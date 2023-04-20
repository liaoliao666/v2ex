import { load } from 'cheerio'
import dayjs from 'dayjs'
import { isArray, isEqual, isString, noop, pick } from 'lodash-es'
import { isObject } from 'twrnc/dist/esm/types'

import {
  createInfiniteQuery,
  createMutation,
  createQuery,
} from '@/react-query-kit'
import { request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

import {
  getNextPageParam,
  parseLastPage,
  parseTopic,
  parseTopicItems,
} from './helper'
import { PageData, Topic } from './types'

export const useTabTopics = createQuery<Topic[], { tab?: string }>({
  primaryKey: 'useTabTopics',
  queryFn: async ({ queryKey: [_, { tab }], signal }) => {
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
})

export const useRecentTopics = createInfiniteQuery<PageData<Topic>, void>({
  primaryKey: 'useRecentTopics',
  queryFn: async ({ pageParam, signal }) => {
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
  defaultPageParam: 1,
  getNextPageParam,
  gcTime: 1000 * 60 * 10,
  staleTime: 10 * 1000,
  structuralSharing: false,
})

export const useTopicById = createQuery<Topic, { id: number }>({
  primaryKey: 'useTopicById',
  queryFn: async ({ signal, queryKey: [_, { id }] }) => {
    const { data } = await request.get(`/api/topics/show.json?id=${id}`, {
      signal,
    })
    const topic = (isArray(data) ? data[0] || {} : {}) as any
    if (topic.member) {
      topic.member.avatar = topic.member.avatar_large
    }
    if (topic.node) {
      topic.node.avatar = topic.node.avatar_large
    }
    if (topic.last_touched) {
      topic.last_touched = dayjs.unix(topic.last_touched).fromNow()
    }
    return topic as Topic
  },
})

export const useTopicDetail = createInfiniteQuery<
  Topic & { page: number; last_page: number },
  { id: number }
>({
  primaryKey: 'useTopicDetail',
  queryFn: async ({ queryKey: [_, { id }], pageParam, signal }) => {
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
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useLikeTopic = createMutation<
  void,
  { id: number; once: string; type: 'unfavorite' | 'favorite' }
>({
  mutationFn: ({ id, once, type: type }) =>
    request.get(`/${type}/topic/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const useThankTopic = createMutation<void, { id: number; once: string }>(
  {
    mutationFn: ({ id, once }) =>
      request.post(`/thank/topic/${id}?once=${once}`),
  }
)

export const useVoteTopic = createMutation<
  number,
  { id: number; once: string; type: 'up' | 'down' }
>({
  mutationFn: async ({ id, once, type: type }) => {
    const { data } = await request.post(`/${type}/topic/${id}?once=${once}`)
    if (!isObject(data) || !isString(data.html)) return Promise.reject()
    const $ = load(data.html as string)
    const votes = parseInt($('.vote').eq(0).text().trim(), 10)

    return votes
  },
})

export const useThankReply = createMutation<void, { id: number; once: string }>(
  {
    mutationFn: ({ id, once }) =>
      request.post(`/thank/reply/${id}?once=${once}`),
  }
)

export const useMyTopics = createInfiniteQuery<PageData<Topic>, void>({
  primaryKey: 'useMyTopics',
  queryFn: async ({ pageParam, signal }) => {
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
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
  gcTime: 1000 * 60 * 10,
})

export const useReply = createMutation<
  void,
  { content: string; once: string; topicId: number }
>({
  mutationFn: ({ topicId, ...args }) => {
    return request.post(`/t/${topicId}`, paramsSerializer(args), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },
})

export const useWriteTopic = createMutation<
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
})

export const useEditTopicInfo = createQuery<
  { content: string; syntax: 'default' | 'markdown' },
  { id: number }
>({
  primaryKey: 'useEditTopicInfo',
  queryFn: async ({ queryKey: [, { id }], signal }) => {
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
})

export const useEditTopic = createMutation<
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
})

export const useAppendTopic = createMutation<
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
})

export const useIgnoreTopic = createMutation<
  void,
  { id: number; once: string; type: 'ignore' | 'unignore' }
>({
  mutationFn: ({ id, once, type }) =>
    request.get(`/${type}/topic/${id}?once=${once}`),
})

export const useIgnoreReply = createMutation<
  void,
  { id: number; once: string }
>({
  mutationFn: ({ id, once }) =>
    request.post(`/ignore/reply/${id}?once=${once}`),
})

export const useReportTopic = createMutation<
  void,
  { id: number; once: string }
>({
  mutationFn: ({ id, once }) => request.get(`/report/topic/${id}?once=${once}`),
})
