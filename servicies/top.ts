import { load } from 'cheerio'
import { router } from 'react-query-kit'

import { request } from '@/utils/request'

import { parseRank } from './helper'

export const topRouter = router(`top`, {
  rich: router.query({
    fetcher: async () => {
      const { data } = await request(`/top/rich`, {
        responseType: 'text',
      })
      return parseRank(load(data))
    },
  }),

  player: router.query({
    fetcher: async () => {
      const { data } = await request(`/top/player`, {
        responseType: 'text',
      })
      return parseRank(load(data))
    },
  }),
})
