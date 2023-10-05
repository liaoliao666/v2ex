import axios from 'axios'
import dayjs from 'dayjs'
import { query, queryWithInfinite } from 'quaere'
import showdown from 'showdown'
import { z } from 'zod'

import { request } from '@/utils/request'
import { stripString, stripStringToNumber } from '@/utils/zodHelper'

import { Sov2exResult } from './types'

export const Sov2exArgs = z.object({
  size: z.preprocess(stripStringToNumber, z.number().int().gte(10).lte(50)),
  sort: z.enum(['sumup', 'created']),
  order: z.enum(['0', '1']),
  gte: z.preprocess(
    stripString,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '格式错误，如 2017-10-13')
      .optional()
  ),
  lte: z.preprocess(stripString, z.string().optional()),
  username: z.preprocess(stripString, z.string().optional()),
  node: z.preprocess(stripString, z.string().optional()),
  q: z.preprocess(stripString, z.string().optional()),
})

export const sov2exQuery = queryWithInfinite<
  Sov2exResult,
  z.infer<typeof Sov2exArgs>
>({
  key: 'sov2ex',
  fetcher: async (params, { pageParam, signal }) => {
    const { data } = await axios.get(`https://www.sov2ex.com/api/search`, {
      params: {
        ...params,
        from: pageParam,
        gte: params.gte ? dayjs(params.gte).valueOf() : undefined,
        lte: params.lte ? dayjs(params.lte).valueOf() : undefined,
      },
      signal,
    })

    return {
      ...data,
      from: pageParam,
      size: params.size,
    }
  },
  initialPageParam: 0,
  getNextPageParam: page => {
    const nextFrom = page.from + page.size
    return nextFrom < page.total ? nextFrom : undefined
  },
  structuralSharing: false,
})

export const repoReadmeQuery = query({
  key: 'repoReadme',
  fetcher: async (variables: { url: string }, { signal }) => {
    const { data } = await request.get(variables.url, {
      responseType: 'text',
      signal,
    })
    return new showdown.Converter().makeHtml(data)
  },
})
