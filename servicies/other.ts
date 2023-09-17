import axios from 'axios'
import { load } from 'cheerio'
import dayjs from 'dayjs'
import { query, queryWithInfinite } from 'quaere'
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
    return load(data)('#readme').html()
  },
})

export const svgQuery = query({
  key: 'svg',
  fetcher: async (variables: { url: string }, { signal }) => {
    const { data: xml } = await request.get<string>(variables.url, {
      signal,
    })
    const $ = load(xml)
    const $svg = $('svg')

    let width: number
    let height: number

    if ($svg.attr('width') && $svg.attr('height')) {
      width = parseFloat($svg.attr('width') as string)
      height = parseFloat($svg.attr('height') as string)
    } else {
      const viewBox = $svg.attr('viewBox') || ''
      ;[, , width, height] = viewBox
        .split(viewBox.includes(',') ? ',' : ' ')
        .map(parseFloat)
    }

    return {
      xml,
      wraperStyle: { aspectRatio: width / height || 1, width: '100%' },
    }
  },
  staleTime: Infinity,
  gcTime: 1000 * 60 * 10,
})
