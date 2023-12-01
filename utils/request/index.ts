import axios from 'axios'
import { CheerioAPI, load } from 'cheerio'
import dayjs from 'dayjs'
import { RESET } from 'jotai/utils'
import { isInteger, isObjectLike, isString } from 'lodash-es'
import { isEqual } from 'lodash-es'
import Toast from 'react-native-toast-message'

import { enabledMsgPushAtom } from '@/jotai/enabledMsgPushAtom'
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { open503UrlTimeAtom } from '@/jotai/open503UrlTimeAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { getAgents } from '@/jotai/socksAgentConfigAtom'
import { store } from '@/jotai/store'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import {
  parseNavAtoms,
  parseProfile,
  parseRecentTopics,
} from '@/servicies/helper'

import { getBaseURL, openURL } from '../url'

export class BizError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BizError'
  }
}

export const request = axios.create({
  baseURL: getBaseURL(),
})

request.interceptors.request.use(config => {
  return {
    ...config,
    ...getAgents(),
    baseURL: getBaseURL(),
  }
})

request.interceptors.response.use(
  response => {
    const { data } = response

    // handle json error
    if (isObjectLike(data) && data.success === false) {
      throw data.message
        ? new BizError(data.message)
        : new Error('Something went wrong')
    }

    const $ = isString(data) ? load(data) : undefined

    // handle html error
    if ($) {
      const problem = $(`#Main > div.box > div.problem > ul > li`)
        .eq(0)
        .text()
        .trim()

      if (problem) {
        throw new BizError(problem)
      }
    }

    // update store
    try {
      if ($) {
        updateProfile($)
        updateNavNodes($)
        updateRecentTopics($)
      }
    } catch (error) {
      // empty
    }

    return response
  },
  error => {
    handle503Error(error)
    if (error instanceof Error && error.message.includes(`403`)) {
      const err = new Error('请检查你的代理设置')
      err.name = '请求失败'
      return Promise.reject(err)
    }
    return Promise.reject(error)
  }
)

async function handle503Error(error: any) {
  try {
    if (
      isObjectLike(error) &&
      isObjectLike(error.config) &&
      error.message.includes(`503`) &&
      error.config.method === 'get' &&
      !error.config.url.startsWith('http')
    ) {
      const open503UrlTime = await store.get(open503UrlTimeAtom)
      if (dayjs().diff(open503UrlTime, 'hour') > 8) {
        store.set(open503UrlTimeAtom, Date.now())
        openURL(`${getBaseURL()}${error.config.url}`)
      }
    }
  } catch {
    // empty
  }
}

function updateProfile($: CheerioAPI) {
  const hasProfile =
    !!$('#Rightbar #money').length ||
    !!$('#Rightbar #member-activity').length ||
    !!$('#Rightbar .light-toggle').length
  if (hasProfile) {
    const newProfile = parseProfile($)

    store.set(profileAtom, prev => {
      if (
        getCurrentRouteName() !== 'Home' &&
        store.get(enabledMsgPushAtom) &&
        newProfile.my_notification !== prev?.my_notification &&
        isInteger(newProfile.my_notification) &&
        newProfile.my_notification! > 0
      ) {
        Toast.show({
          type: 'success',
          text1: `消息通知`,
          text2: `你有 ${newProfile.my_notification} 条未读消息`,
          onPress: () => {
            navigation.navigate('Notifications')
            Toast.hide()
          },
        })
      }

      return isEqual(newProfile, prev) ? prev : newProfile
    })
  } else if (
    $('#Top div.tools > a:nth-child(3)').attr('href')?.includes('signin')
  ) {
    store.set(profileAtom, RESET)
  }
}

function updateNavNodes($: CheerioAPI) {
  const $nodesBox = $(`#Main .box`).eq(1)
  const hasNavAtoms = $nodesBox.find('.fr a').eq(0).attr('href') === '/planes'
  if (!hasNavAtoms) return
  store.set(navNodesAtom, parseNavAtoms($))
}

function updateRecentTopics($: CheerioAPI) {
  if ($(`#my-recent-topics`).length) {
    store.set(recentTopicsAtom, parseRecentTopics($))
  }
}
