import { load } from 'cheerio'
import { query } from 'quaere'

import { request } from '@/utils/request'

import { parseRank } from './helper'

export const topRichQuery = query({
  key: `topRich`,
  fetcher: async () => {
    const { data } = await request(`/top/rich`, {
      responseType: 'text',
    })
    return parseRank(load(data))
  },
})

export const topPlayerQuery = query({
  key: `topPlayer`,
  fetcher: async () => {
    const { data } = await request(`/top/player`, {
      responseType: 'text',
    })
    return parseRank(load(data))
  },
})
