import { load } from 'cheerio'
import { compact, last } from 'lodash-es'
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

export const useMember = createQuery<Member, { username: string }>(
  'useMember',
  async ({ signal, queryKey: [_, { username }] }) => {
    const { data } = await request.get(`/member/${username}`, { signal })
    const $ = load(data)
    return { ...parseMember($), username }
  }
)

export const useFollowMember = createMutation<
  void,
  { id: number; once: string; type: 'unfollow' | 'follow' }
>(({ id, once, type: type }) =>
  request.get(`/${type}/${id}?once=${once}`, {
    responseType: 'text',
  })
)

export const useBlockMember = createMutation<
  void,
  { id: number; once: string; type: 'block' | 'unblock' }
>(({ id, once, type: type }) =>
  request.get(`/${type}/${id}?once=${once}`, {
    responseType: 'text',
  })
)

export const useMemberTopics = createInfiniteQuery<
  PageData<Topic> & { hidden_text?: string },
  { username: string }
>(
  'useMemberTopics',
  async ({ pageParam, signal, queryKey: [, variables] }) => {
    const page = pageParam ?? 1
    const { data } = await request.get(
      `/member/${variables.username}/topics?p=${page}`,
      {
        responseType: 'text',
        signal,
      }
    )
    const $ = load(data)

    return {
      page,
      last_page: parseLastPage($),
      list: parseTopicItems($, '#Main .box .cell.item'),
      hidden_text: $('#Main .box .topic_content').eq(0).text(),
    }
  },
  {
    getNextPageParam,
    structuralSharing: false,
  }
)

export const useMemberReplies = createInfiniteQuery<
  PageData<Omit<Topic, 'replies'> & { reply: Reply }>,
  { username: string }
>(
  'useMemberReplies',
  async ({ pageParam, signal, queryKey: [, variables] }) => {
    const page = pageParam ?? 1
    const { data } = await request.get(
      `/member/${variables.username}/replies?p=${page}`,
      {
        responseType: 'text',
        signal,
      }
    )
    const $ = load(data)

    return {
      page,
      last_page: parseLastPage($),
      list: parseMemberReplies($),
    }
  },
  {
    getNextPageParam,
  }
)

export const useMyFollowing = createInfiniteQuery<
  PageData<Topic> & { following: Member[] }
>(
  'useMyFollowing',
  async ({ pageParam, signal }) => {
    const page = pageParam ?? 1
    const { data } = await request.get(`/my/following?p=${page}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    return {
      page,
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
  {
    getNextPageParam,
    structuralSharing: false,
  }
)

export const useCheckin = createQuery('useCheckin', async () => {
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
  const amount = load(balanceResult)(
    'table>tbody>tr:contains("每日登录"):first>td:nth(2)'
  ).text()
  return Number(amount) || 0
})

export const useMemberById = createQuery<Member, { id: number }>(
  'useMemberById',
  async ({ signal, queryKey: [_, { id }] }) => {
    const { data } = await request.get(`/api/members/show.json?id=${id}`, {
      signal,
    })
    data.avatar = data.avatar_large
    return data
  }
)

export const useBlockers = createInfiniteQuery<
  PageData<Member>,
  { ids: number[] }
>(
  'useBlockers',
  async ({ pageParam, queryKey: [, { ids = [] }] }) => {
    const page = pageParam ?? 1
    const pageSize = 10
    const chunkIds = ids.slice(page - 1, page * 10)
    const cacheMemberMap = queryClient
      .getQueriesData<inferData<typeof useMember>>(useMember.getKey())
      .reduce((acc, [, member]) => {
        if (member?.id) {
          acc[member.id] = member
        }
        return acc
      }, {} as Record<string, Member>)

    return {
      page,
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
  {
    getNextPageParam,
    structuralSharing: false,
  }
)

export const useIgnoredTopics = createInfiniteQuery<
  PageData<Topic>,
  { ids: number[] }
>(
  'useIgnoredTopics',
  async ({ pageParam, queryKey: [, { ids = [] }] }) => {
    const page = pageParam ?? 1
    const pageSize = 10
    const chunkIds = ids.slice(page - 1, page * 10)
    const cacheTopicMap = {} as Record<string, Topic>

    const recentTopics = await store.get(recentTopicsAtom)
    recentTopics?.forEach(topic => {
      cacheTopicMap[topic.id] = topic as Topic
    })

    queryClient
      .getQueriesData<inferData<typeof useNodeTopics>>(useNodeTopics.getKey())
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
      .getQueriesData<inferData<typeof useTabTopics>>(useTabTopics.getKey())
      .forEach(([, data]) => {
        data?.forEach(topic => {
          cacheTopicMap[topic.id] = topic
        })
      })
    queryClient
      .getQueriesData<inferData<typeof useTopicDetail>>(useTopicDetail.getKey())
      .forEach(([, data]) => {
        const topic = last(data?.pages)
        if (topic?.id) {
          cacheTopicMap[topic.id] = topic
        }
      })

    return {
      page,
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
  {
    getNextPageParam,
    structuralSharing: false,
  }
)
