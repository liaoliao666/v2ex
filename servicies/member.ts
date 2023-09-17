import { load } from 'cheerio'
import { compact, last } from 'lodash-es'
import { mutation, query, queryWithInfinite } from 'quaere'
import Toast from 'react-native-toast-message'

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
import { nodeTopicsQuery } from './node'
import {
  recentTopicsQuery,
  tabTopicsQuery,
  topicByIdQuery,
  topicDetailQuery,
} from './topic'
import { Member, PageData, Reply, Topic } from './types'

export const memberQuery = query({
  key: 'member',
  fetcher: async (
    { username }: { username: string },
    { signal }
  ): Promise<Member> => {
    const { data } = await request.get(`/member/${username}`, { signal })
    const $ = load(data)
    return { ...parseMember($), username }
  },
})

export const followMemberMutation = mutation({
  fetcher: ({
    id,
    once,
    type: type,
  }: {
    id: number
    once: string
    type: 'unfollow' | 'follow'
  }) =>
    request.get(`/${type}/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const blockMemberMutation = mutation<
  void,
  { id: number; once: string; type: 'block' | 'unblock' }
>({
  fetcher: ({ id, once, type: type }) =>
    request.get(`/${type}/${id}?once=${once}`, {
      responseType: 'text',
    }),
})

export const memberTopicsQuery = queryWithInfinite<
  PageData<Topic> & { hidden_text?: string },
  { username: string },
  void
>({
  key: 'memberTopics',
  fetcher: async (variables, { signal, pageParam }) => {
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
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const memberRepliesQuery = queryWithInfinite<
  PageData<Omit<Topic, 'replies'> & { reply: Reply }>,
  { username: string }
>({
  key: 'memberReplies',
  fetcher: async (variables, { pageParam, signal }) => {
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
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const myFollowingQuery = queryWithInfinite<
  PageData<Topic> & { following: Member[] }
>({
  key: 'myFollowing',
  fetcher: async (_, { pageParam, signal }) => {
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
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const checkinQuery = query({
  fetcher: async () => {
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

export const memberByIdQuery = query<Member, { id: number }>({
  key: 'memberById',
  fetcher: async ({ id }, { signal }) => {
    const { data } = await request.get(`/api/members/show.json?id=${id}`, {
      signal,
    })
    data.avatar = data.avatar_large
    return data
  },
})

export const blockersQuery = queryWithInfinite<
  PageData<Member>,
  { ids: number[] }
>({
  key: 'blockers',
  fetcher: async ({ ids = [] }, { pageParam }) => {
    const pageSize = 10
    const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
    const cacheMemberMap = queryClient
      .getQueriesData({
        query: memberQuery,
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
                query: memberByIdQuery,
                variables: { id },
              })
              .catch(() => null)
          })
        )
      ),
    }
  },
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const ignoredTopicsQuery = queryWithInfinite<
  PageData<Topic>,
  { ids: number[] }
>({
  key: 'ignoredTopics',
  fetcher: async ({ ids = [] }, { pageParam }) => {
    const pageSize = 10
    const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
    const cacheTopicMap = {} as Record<string, Topic>

    const recentTopics = await store.get(recentTopicsAtom)
    recentTopics?.forEach(topic => {
      cacheTopicMap[topic.id] = topic as Topic
    })

    queryClient
      .getQueriesData({
        query: nodeTopicsQuery,
      })
      .forEach(([, data]) => {
        data?.pages?.forEach(p => {
          p.list.forEach(topic => {
            cacheTopicMap[topic.id] = topic
          })
        })
      })
    queryClient
      .getQueryData({ query: recentTopicsQuery })
      ?.pages?.forEach(p => {
        p.list.forEach(topic => {
          cacheTopicMap[topic.id] = topic
        })
      })
    queryClient
      .getQueriesData({
        query: tabTopicsQuery,
      })
      .forEach(([, data]) => {
        data?.forEach(topic => {
          cacheTopicMap[topic.id] = topic
        })
      })
    queryClient
      .getQueriesData({
        query: topicDetailQuery,
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
                query: topicByIdQuery,
                variables: { id },
              })
              .catch(() => null)
          })
        )
      ),
    }
  },
  initialPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})
