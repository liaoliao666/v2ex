import { load } from 'cheerio'
import { compact, last } from 'lodash-es'
import Toast from 'react-native-toast-message'
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
  inferData,
} from 'react-query-kit'

import { recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { store } from '@/jotai/store'
import { queryClient } from '@/utils/query'
import { request } from '@/utils/request'

import {
  getNextPageParam,
  parseLastPage,
  parseMember,
  parseMemberReplies,
  parseTopicItems,
} from './helper'
import { useNodeTopics } from './node'
import {
  useRecentTopics,
  useTabTopics,
  useTopicById,
  useTopicDetail,
} from './topic'
import { Member, PageData, Reply, Topic } from './types'

export const useMember = createQuery<Member, { username: string }>({
  primaryKey: 'useMember',
  queryFn: async ({ signal, queryKey: [_, { username }] }) => {
    const { data } = await request.get(`/member/${username}`, { signal })
    const $ = load(data)
    return { ...parseMember($), username }
  },
})

export const useFollowMember = createMutation<
  void,
  { id: number; once: string; type: 'unfollow' | 'follow' }
>({
  mutationFn: ({ id, once, type: type }) =>
    request.get(`/${type}/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const useBlockMember = createMutation<
  void,
  { id: number; once: string; type: 'block' | 'unblock' }
>({
  mutationFn: ({ id, once, type: type }) =>
    request.get(`/${type}/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const useMemberTopics = createInfiniteQuery<
  PageData<Topic> & { hidden_text?: string },
  { username: string }
>({
  primaryKey: 'useMemberTopics',
  queryFn: async ({ pageParam, signal, queryKey: [, variables] }) => {
    const { data } = await request.get(
      `/member/${variables.username}/topics?p=${pageParam}`,
      {
        responseType: 'text',
        signal,
      }
    )
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: parseTopicItems($, '#Main .box .cell.item'),
      hidden_text: $('#Main .box .topic_content').eq(0).text(),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useMemberReplies = createInfiniteQuery<
  PageData<Omit<Topic, 'replies'> & { reply: Reply }>,
  { username: string }
>({
  primaryKey: 'useMemberReplies',
  queryFn: async ({ pageParam, signal, queryKey: [, variables] }) => {
    const { data } = await request.get(
      `/member/${variables.username}/replies?p=${pageParam}`,
      {
        responseType: 'text',
        signal,
      }
    )
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: parseMemberReplies($),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useMyFollowing = createInfiniteQuery<
  PageData<Topic> & { following: Member[] }
>({
  primaryKey: 'useMyFollowing',
  queryFn: async ({ pageParam, signal }) => {
    const { data } = await request.get(`/my/following?p=${pageParam}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: parseTopicItems($, '#Main .box .cell.item'),
      following: $('#Rightbar .box')
        .eq(1)
        .find('a > img')
        .map((i, img) => {
          const $avatar = $(img)
          return {
            username: $avatar.attr('alt'),
            avatar: $avatar.attr('src'),
          } as Member
        })
        .get(),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useCheckin = createQuery({
  primaryKey: 'useCheckin',
  queryFn: async () => {
    // https://gist.github.com/VitoVan/bf00ce496b44c56417a675c521fe67e8
    const { data: result } = await request.get('/mission/daily', {
      responseType: 'text',
    })
    const giftLink = load(result)('input[value^="领取"]')
      .attr('onclick')
      ?.match(/\/mission\/daily\/redeem\?once=\d+/g)?.[0]
    if (!giftLink) return Promise.resolve(0)
    const { data: checkResult } = await request.get(giftLink, {
      responseType: 'text',
    })
    const okSign = load(checkResult)('li.fa.fa-ok-sign')
    if (okSign.length <= 0) return Promise.reject(new Error('签到失败'))
    const { data: balanceResult } = await request.get('/balance')
    const amount =
      Number(
        load(balanceResult)(
          'table>tbody>tr:contains("每日登录"):first>td:nth(2)'
        ).text()
      ) || 0

    if (amount > 0) {
      Toast.show({
        type: 'success',
        text1: `自动签到成功`,
        text2: `已领取 ${amount} 铜币`,
      })
    }

    return amount
  },
})

export const useMemberById = createQuery<Member, { id: number }>({
  primaryKey: 'useMemberById',
  queryFn: async ({ signal, queryKey: [_, { id }] }) => {
    const { data } = await request.get(`/api/members/show.json?id=${id}`, {
      signal,
    })
    data.avatar = data.avatar_large
    return data
  },
})

export const useBlockers = createInfiniteQuery<
  PageData<Member>,
  { ids: number[] }
>({
  primaryKey: 'useBlockers',
  queryFn: async ({ pageParam, queryKey: [, { ids = [] }] }) => {
    const pageSize = 10
    const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
    const cacheMemberMap = queryClient
      .getQueriesData<inferData<typeof useMember>>({
        queryKey: useMember.getKey(),
      })
      .reduce((acc, [, member]) => {
        if (member?.id) {
          acc[member.id] = member
        }
        return acc
      }, {} as Record<string, Member>)

    return {
      page: pageParam,
      last_page: Math.ceil(ids.length / pageSize),
      list: compact(
        await Promise.all(
          chunkIds.map(async id => {
            if (cacheMemberMap[id]) return cacheMemberMap[id]
            return await queryClient
              .ensureQueryData({
                queryKey: useMemberById.getKey({ id }),
                queryFn: useMemberById.queryFn,
              })
              .catch(() => null)
          })
        )
      ),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useIgnoredTopics = createInfiniteQuery<
  PageData<Topic>,
  { ids: number[] }
>({
  primaryKey: 'useIgnoredTopics',
  queryFn: async ({ pageParam, queryKey: [, { ids = [] }] }) => {
    const pageSize = 10
    const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
    const cacheTopicMap = {} as Record<string, Topic>

    const recentTopics = await store.get(recentTopicsAtom)
    recentTopics?.forEach(topic => {
      cacheTopicMap[topic.id] = topic as Topic
    })

    queryClient
      .getQueriesData<inferData<typeof useNodeTopics>>({
        queryKey: useNodeTopics.getKey(),
      })
      .forEach(([, data]) => {
        data?.pages?.forEach(p => {
          p.list.forEach(topic => {
            cacheTopicMap[topic.id] = topic
          })
        })
      })
    queryClient
      .getQueryData<inferData<typeof useRecentTopics>>(useRecentTopics.getKey())
      ?.pages?.forEach(p => {
        p.list.forEach(topic => {
          cacheTopicMap[topic.id] = topic
        })
      })
    queryClient
      .getQueriesData<inferData<typeof useTabTopics>>({
        queryKey: useTabTopics.getKey(),
      })
      .forEach(([, data]) => {
        data?.forEach(topic => {
          cacheTopicMap[topic.id] = topic
        })
      })
    queryClient
      .getQueriesData<inferData<typeof useTopicDetail>>({
        queryKey: useTopicDetail.getKey(),
      })
      .forEach(([, data]) => {
        const topic = last(data?.pages)
        if (topic?.id) {
          cacheTopicMap[topic.id] = topic
        }
      })

    return {
      page: pageParam,
      last_page: Math.ceil(ids.length / pageSize),
      list: compact(
        await Promise.all(
          chunkIds.map(async id => {
            if (cacheTopicMap[id]) return cacheTopicMap[id]
            return await queryClient
              .ensureQueryData({
                queryKey: useTopicById.getKey({ id }),
                queryFn: useTopicById.queryFn,
              })
              .catch(() => null)
          })
        )
      ),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})
