import { load } from 'cheerio'
import {
  createInfiniteQuery,
  createMutation,
  createQuery,
} from 'react-query-kit'

import { request } from '@/utils/request'

import {
  getNextPageParam,
  parseLastPage,
  parseMember,
  parseMemberReplies,
  parseTopicItems,
} from './helper'
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
  PageData<Topic> & { hidden: boolean },
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
      hidden: $('#Main .box .topic_content')
        .eq(0)
        .text()
        .includes('主题列表被隐藏'),
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

export const useCheckin = createQuery(
  'useCheckin',
  async () => {
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
  },
  {
    cacheTime: 1000 * 60 * 60 * 24,
    staleTime: 1000 * 60 * 60 * 8,
  }
)
