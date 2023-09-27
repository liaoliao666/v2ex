import { load } from 'cheerio'
import dayjs from 'dayjs'
import { isArray, isEqual, isString, noop, pick } from 'lodash-es'
import { mutation, query, queryWithInfinite } from 'quaere'

import { request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

import {
  getNextPageParam,
  parseLastPage,
  parseTopic,
  parseTopicItems,
} from './helper'
import { PageData, Topic } from './types'

export const tabTopicsQuery = query<Topic[], { tab?: string }>({
  key: 'tabTopics',
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
})

export const recentTopicsQuery = queryWithInfinite<PageData<Topic>, void>({
  key: 'recentTopics',
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
})

export const topicByIdQuery = query<Topic, { id: number }>({
  key: 'topicById',
  fetcher: async ({ id }, { signal }) => {
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

export const topicDetailQuery = queryWithInfinite<
  Topic & { page: number; last_page: number; image_count: number },
  { id: number }
>({
  key: 'topicDetail',
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
})

export const likeTopicMutation = mutation<
  void,
  { id: number; once: string; type: 'unfavorite' | 'favorite' }
>({
  fetcher: ({ id, once, type: type }) =>
    request.get(`/${type}/topic/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const thankTopicMutation = mutation<void, { id: number; once: string }>({
  fetcher: ({ id, once }) => request.post(`/thank/topic/${id}?once=${once}`),
})

export const voteTopicMutation = mutation<
  number,
  { id: number; once: string; type: 'up' | 'down' }
>({
  fetcher: async ({ id, once, type: type }) => {
    const { data } = await request.post(`/${type}/topic/${id}?once=${once}`)
    if (typeof data !== 'object' || !isString(data.html))
      return Promise.reject()
    const $ = load(data.html as string)
    const votes = parseInt($('.vote').eq(0).text().trim(), 10)

    return votes
  },
})

export const thankReplyMutation = mutation<void, { id: number; once: string }>({
  fetcher: ({ id, once }) => request.post(`/thank/reply/${id}?once=${once}`),
})

export const myTopicsQuery = queryWithInfinite<PageData<Topic>, void>({
  key: 'myTopics',
  fetcher: async (_, { pageParam, signal }) => {
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
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const replyMutation = mutation<
  void,
  { content: string; once: string; topicId: number }
>({
  fetcher: ({ topicId, ...args }) => {
    return request.post(`/t/${topicId}`, paramsSerializer(args), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  },
})

export const writeTopicMutation = mutation<
  void,
  {
    title: string
    content?: string
    node_name: string
    syntax: 'default' | 'markdown'
    once: string
  }
>({
  fetcher: args =>
    request.post(`/write`, paramsSerializer(args), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
})

export const editTopicInfoQuery = query<
  { content: string; syntax: 'default' | 'markdown' },
  { id: number }
>({
  key: 'editTopicInfo',
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
})

export const eitTopicMutation = mutation<
  void,
  {
    title: string
    content?: string
    node_name: string
    syntax: 0 | 1
    prevTopic: Topic
  }
>({
  fetcher: async ({ prevTopic, ...args }) => {
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

export const appendTopicMutation = mutation<
  void,
  {
    content?: string
    once: string
    topicId: number
  }
>({
  fetcher: ({ topicId, ...args }) =>
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

export const ignoreTopicMutation = mutation<
  void,
  { id: number; once: string; type: 'ignore' | 'unignore' }
>({
  fetcher: ({ id, once, type }) =>
    request.get(`/${type}/topic/${id}?once=${once}`),
})

export const ignoreReplyMutation = mutation<void, { id: number; once: string }>(
  {
    fetcher: ({ id, once }) => request.post(`/ignore/reply/${id}?once=${once}`),
  }
)

export const reportTopicMutation = mutation<void, { id: number; once: string }>(
  {
    fetcher: ({ id, once }) => request.get(`/report/topic/${id}?once=${once}`),
  }
)
