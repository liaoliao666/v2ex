import axios from 'axios'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

import { createQuery } from '@/react-query-kit'

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

export const useLatestVersion = createQuery<
  {
    version: string
    latest_version: string
    download_url: string
    need_upgrade: boolean
  },
  void
>({
  primaryKey: 'useLatestVersion',
  queryFn: async () => {
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
