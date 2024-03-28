import axios from 'axios'
import { load } from 'cheerio'
import dayjs from 'dayjs'
import Constants from 'expo-constants'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { Platform } from 'react-native'
import { router } from 'react-query-kit'
import showdown from 'showdown'
import SparkMD5 from 'spark-md5'
import { z } from 'zod'

import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { store } from '@/jotai/store'
import { disabledIfFetched, removeUnnecessaryPages } from '@/utils/query'
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

export const otherRouter = router(`other`, {
  sov2ex: router.infiniteQuery({
    fetcher: async (
      params: z.infer<typeof Sov2exArgs>,
      { pageParam, signal }
    ): Promise<Sov2exResult> => {
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
    use: [removeUnnecessaryPages],
  }),

  repoReadme: router.query({
    fetcher: async (variables: { url: string }, { signal }) => {
      const { data } = await request.get(variables.url, {
        responseType: 'text',
        signal,
      })
      return new showdown.Converter().makeHtml(data)
    },
  }),

  latestVersion: router.query({
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
  }),

  uploadImage: router.mutation({
    mutationFn: async () => {
      const clientId = store.get(imgurConfigAtom)?.clientId

      if (!clientId) return Promise.reject(new Error('请先配置你的Imgur'))

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      })

      if (result.canceled) return Promise.reject(new Error('已取消选择图片'))

      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: 'base64',
      })
      const md5 = SparkMD5.hashBinary(base64)
      const cache = store.get(imgurConfigAtom)?.uploadedFiles[md5]

      if (cache) return cache

      const formData = new FormData()
      formData.append('type', 'base64')
      formData.append('image', base64)

      const {
        data: { data },
      } = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
          Authorization: `Client-ID ${clientId}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!data.link) {
        return Promise.reject(new Error('上传图片失败'))
      }

      store.set(imgurConfigAtom, prev => ({
        ...prev,
        uploadedFiles: {
          ...prev.uploadedFiles,
          [md5]: data.link,
        },
      }))

      return data.link as string
    },
  }),

  svgXml: router.query({
    fetcher: async (uri: string) => {
      const { data: xml } = await request.get<string>(uri!)
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
        width,
        height,
      }
    },
    gcTime: 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
    retry: 0,
    use: [disabledIfFetched],
  }),
})
