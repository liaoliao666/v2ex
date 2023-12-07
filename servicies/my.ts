import { load } from 'cheerio'
import { router } from 'react-query-kit'

import { queryClient, removeUnnecessaryPages } from '@/utils/query'
import { request } from '@/utils/request'

import {
  getNextPageParam,
  parseLastPage,
  parseTopicItems,
  pasreArgByATag,
} from './helper'
import { nodeService } from './node'
import { Member, Node, PageData, Topic } from './types'

export const myService = router(`my`, {
  nodes: router.query({
    fetcher: async (_, { signal }): Promise<Node[]> => {
      const [data, nodes] = await Promise.all([
        request.get(`/my/nodes`, { signal }).then(res => res.data),
        queryClient.ensureQueryData(nodeService.all.getFetchOptions()),
      ])
      const nodeMap = Object.fromEntries(nodes.map(node => [node.name, node]))
      const $ = load(data)
      return $('#my-nodes a')
        .map((i, a) => nodeMap[pasreArgByATag($(a), 'go')])
        .get()
        .filter(Boolean)
    },
  }),

  following: router.infiniteQuery({
    fetcher: async (
      _,
      { pageParam, signal }
    ): Promise<PageData<Topic> & { following: Member[] }> => {
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
    use: [removeUnnecessaryPages],
  }),

  topics: router.infiniteQuery<PageData<Topic>, void>({
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
    use: [removeUnnecessaryPages],
  }),
})
