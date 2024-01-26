import { load } from 'cheerio'
import { compact, last } from 'lodash-es'
import Toast from 'react-native-toast-message'
import { inferData, router } from 'react-query-kit'

import { recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { store } from '@/jotai/store'
import { queryClient, removeUnnecessaryPages } from '@/utils/query'
import { request } from '@/utils/request'

import {
  getNextPageParam,
  parseLastPage,
  parseMember,
  parseMemberReplies,
  parseTopicItems,
} from './helper'
import { nodeRouter } from './node'
import { topicRouter } from './topic'
import { Member, PageData, Topic } from './types'

export const memberRouter = router(`member`, {
  byUsername: router.query({
    fetcher: async (
      { username }: { username: string },
      { signal }
    ): Promise<Member> => {
      const { data } = await request.get(`/member/${username}`, { signal })
      const $ = load(data)
      return { ...parseMember($), username }
    },
  }),

  byId: router.query({
    fetcher: async ({ id }: { id: number }, { signal }): Promise<Member> => {
      const { data } = await request.get(`/api/members/show.json?id=${id}`, {
        signal,
      })
      data.avatar = data.avatar_large
      return data
    },
  }),

  follow: router.mutation({
    mutationFn: ({
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
  }),

  block: router.mutation({
    mutationFn: ({
      id,
      once,
      type: type,
    }: {
      id: number
      once: string
      type: 'block' | 'unblock'
    }) =>
      request.get(`/${type}/${id}?once=${once}`, {
        responseType: 'text',
      }),
  }),

  topics: router.infiniteQuery({
    fetcher: async (
      variables: { username: string },
      { signal, pageParam }
    ): Promise<PageData<Topic> & { hidden_text?: string }> => {
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
    use: [removeUnnecessaryPages],
  }),

  replies: router.infiniteQuery({
    fetcher: async (
      variables: { username: string },
      { pageParam, signal }
    ): Promise<PageData<ReturnType<typeof parseMemberReplies>[number]>> => {
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
    use: [removeUnnecessaryPages],
  }),

  checkin: router.query({
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
  }),

  blockers: router.infiniteQuery({
    fetcher: async (
      { ids = [] }: { ids: number[] },
      { pageParam }
    ): Promise<PageData<Member>> => {
      const pageSize = 10
      const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
      const cacheMemberMap = queryClient
        .getQueriesData<inferData<typeof memberRouter.byUsername>>({
          queryKey: memberRouter.byUsername.getKey(),
        })
        .reduce((acc, [, item]) => {
          if (item?.id) {
            acc[item.id] = item
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
                .ensureQueryData(memberRouter.byId.getFetchOptions({ id }))
                .catch(() => null)
            })
          )
        ),
      }
    },
    initialPageParam: 1,
    getNextPageParam,
    structuralSharing: false,
    use: [removeUnnecessaryPages],
  }),

  ignoredTopics: router.infiniteQuery({
    fetcher: async (
      { ids = [] }: { ids: number[] },
      { pageParam }
    ): Promise<PageData<Topic>> => {
      const pageSize = 10
      const chunkIds = ids.slice(pageParam - 1, pageParam * 10)
      const cacheTopicMap = {} as Record<string, Topic>

      const recentTopics = await store.get(recentTopicsAtom)
      recentTopics?.forEach(item => {
        cacheTopicMap[item.id] = item as Topic
      })

      queryClient
        .getQueriesData<inferData<typeof nodeRouter.topics>>({
          queryKey: nodeRouter.topics.getKey(),
        })
        .forEach(([, data]) => {
          data?.pages?.forEach(p => {
            p.list.forEach(item => {
              cacheTopicMap[item.id] = item
            })
          })
        })
      queryClient
        .getQueryData(topicRouter.recent.getKey())
        ?.pages?.forEach(p => {
          p.list.forEach(item => {
            cacheTopicMap[item.id] = item
          })
        })
      queryClient
        .getQueriesData<inferData<typeof topicRouter.tab>>({
          queryKey: topicRouter.tab.getKey(),
        })
        .forEach(([, data]) => {
          data?.forEach(item => {
            cacheTopicMap[item.id] = item
          })
        })
      queryClient
        .getQueriesData<inferData<typeof topicRouter.detail>>({
          queryKey: topicRouter.detail.getKey(),
        })
        .forEach(([, data]) => {
          const item = last(data?.pages)
          if (item?.id) {
            cacheTopicMap[item.id] = item
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
                .ensureQueryData(topicRouter.byId.getFetchOptions({ id }))
                .catch(() => null)
            })
          )
        ),
      }
    },
    initialPageParam: 1,
    getNextPageParam,
    structuralSharing: false,
    use: [removeUnnecessaryPages],
  }),
})
