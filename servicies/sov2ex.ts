import axios from 'axios'
import dayjs from 'dayjs'
import { createInfiniteQuery } from 'react-query-kit'
import { z } from 'zod'

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

export const useSov2ex = createInfiniteQuery<
  Sov2exResult,
  z.infer<typeof Sov2exArgs>
>(
  'useSov2ex',
  async ({ queryKey: [, params], pageParam, signal }) => {
    const page = pageParam ?? 0
    const { data } = await axios.get(`https://www.sov2ex.com/api/search`, {
      params: {
        ...params,
        from: page,
        gte: params.gte ? dayjs(params.gte).valueOf() : undefined,
        lte: params.lte ? dayjs(params.lte).valueOf() : undefined,
      },
      signal,
    })

    return {
      ...data,
      from: page,
      size: params.size,
    }
  },
  {
    getNextPageParam: page => {
      const nextFrom = page.from + page.size
      return nextFrom < page.total ? nextFrom : undefined
    },
    structuralSharing: false,
    cacheTime: 1000 * 60 * 10,
  }
)
