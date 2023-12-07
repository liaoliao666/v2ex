import axios from 'axios'
import dayjs from 'dayjs'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import {
  createQuery,
  createSuspenseInfiniteQuery,
  createSuspenseQuery,
} from 'react-query-kit'
import showdown from 'showdown'
import { z } from 'zod'

import { removeUnnecessaryPages } from '@/utils/query'
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
  source: z.enum(['sov2ex', 'google']).optional(),
})

export const useSov2exQuery = createSuspenseInfiniteQuery<
  Sov2exResult,
  z.infer<typeof Sov2exArgs>
>({
  queryKey: ['sov2ex'],
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
  use: [removeUnnecessaryPages as any],
})

export const useRepoReadmeQuery = createSuspenseQuery({
  queryKey: ['repoReadme'],
  fetcher: async (variables: { url: string }, { signal }) => {
    const { data } = await request.get(variables.url, {
      responseType: 'text',
      signal,
    })
    return new showdown.Converter().makeHtml(data)
  },
})

function compareVersion(version1: string, version2: string) {
  const newVersion1 =
    `${version1}`.split('.').length < 3
      ? `${version1}`.concat('.0')
      : `${version1}`
  const newVersion2 =
    `${version2}`.split('.').length < 3
      ? `${version2}`.concat('.0')
      : `${version2}`
  // 计算版本号大小,转化大小
  function toNum(a: string) {
    const c = a.toString().split('.')
    const num_place = ['', '0', '00', '000', '0000']
    const r = num_place.reverse()
    for (let i = 0; i < c.length; i += 1) {
      const len = c[i].length
      c[i] = r[len] + c[i]
    }
    return c.join('')
  }

  // 检测版本号是否需要更新
  function checkPlugin(a: string, b: string) {
    const numA = toNum(a)
    const numB = toNum(b)
    return numA > numB ? 1 : numA < numB ? -1 : 0
  }

  return checkPlugin(newVersion1, newVersion2)
}

export const useLatestVersionQuery = createQuery<
  {
    version: string
    latest_version: string
    download_url: string
    need_upgrade: boolean
  },
  void
>({
  queryKey: ['latestVersion'],
  fetcher: async () => {
    const { data } = await axios.get(
      'https://api.github.com/repos/liaoliao666/v2ex/releases/latest'
    )

    return {
      version: Constants.expoConfig?.version,
      latest_version: data.tag_name,
      need_upgrade:
        compareVersion(data.tag_name, Constants.expoConfig?.version!) === 1,
      download_url:
        Platform.OS === 'android'
          ? data.assets?.[0]?.browser_download_url ??
            'https://github.com/liaoliao666/v2ex'
          : 'https://apps.apple.com/cn/app/v2fun/id1659591551?l=en',
    } as {
      version: string
      latest_version: string
      need_upgrade: boolean
      download_url: string
    }
  },
  staleTime: 1000 * 60 * 60 * 24, // 24 hours
})
