import axios from 'axios'
import { load } from 'cheerio'
import dayjs from 'dayjs'
import { RESET } from 'jotai/utils'
import { isEmpty, isFunction, isNumber } from 'lodash-es'
import { isEqual } from 'lodash-es'
import Toast from 'react-native-toast-message'

import { enabledMsgPushAtom } from '@/jotai/enabledMsgPushAtom'
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { open503UrlTimeAtom } from '@/jotai/open503UrlTimeAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { store } from '@/jotai/store'
import { getNavigation } from '@/navigation/navigationRef'
import {
  parseNavAtoms,
  parseProfile,
  parseRecentTopics,
} from '@/servicies/helper'

import { setCookie } from '../cookie'
import { openURL } from '../url'
import { baseURL } from './baseURL'

export const request = axios.create({
  baseURL,
})

request.interceptors.request.use(async config => {
  return {
    ...config,
    // adapter:
    //   config.url && config.url.startsWith('http')
    //     ? undefined
    //     : v2exMessage.sendMessage,
  }
})

request.interceptors.response.use(
  response => {
    updateStoreWithData(response.data)
    if (!isEmpty(response.headers['set-cookie'])) {
      setCookie(response.headers['set-cookie']!)
    }
    return response
  },
  error => {
    handle503Error(error)
    return Promise.reject(error)
  }
)

async function handle503Error(error: any) {
  try {
    if (error.message.includes(`503`) && !error.config.url.startsWith('http')) {
      const open503UrlTime = await store.get(open503UrlTimeAtom)
      if (dayjs().diff(open503UrlTime, 'day') > 1) {
        store.set(open503UrlTimeAtom, Date.now())
        openURL(`${baseURL}${error.config.url}`)
      }
    }
  } catch {
    // empty
  }
}

export function updateStoreWithData(data: any) {
  if (typeof data !== 'string') return

  const $ = load(data)

  function updateProfile() {
    const hasProfile = !!$('#Rightbar #money').length
    if (hasProfile) {
      const newProfile = parseProfile($)

      store.set(profileAtom, prev => {
        // @ts-ignore
        const getCurrentRoute: any = getNavigation()?.getCurrentRoute
        const currentRouteName = isFunction(getCurrentRoute)
          ? getCurrentRoute()?.name
          : undefined

        if (
          currentRouteName !== 'HomeScreen' &&
          store.get(enabledMsgPushAtom) &&
          newProfile.my_notification !== prev?.my_notification &&
          isNumber(newProfile.my_notification) &&
          isFinite(newProfile.my_notification) &&
          newProfile.my_notification > 0
        ) {
          Toast.show({
            type: 'success',
            text1: `消息通知`,
            text2: `你有 ${newProfile.my_notification} 条未读消息`,
            onPress: () => {
              getNavigation()?.navigate('Notifications')
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

  function updateNavNodes() {
    const $nodesBox = $(`#Main .box`).eq(1)
    const hasNavAtoms = $nodesBox.find('.fr a').eq(0).attr('href') === '/planes'
    if (!hasNavAtoms) return
    store.set(navNodesAtom, parseNavAtoms($))
  }

  function updateRecentTopics() {
    if ($(`#my-recent-topics`).length) {
      store.set(recentTopicsAtom, parseRecentTopics($))
    }
  }

  try {
    updateProfile()
    updateNavNodes()
    updateRecentTopics()
  } catch (error) {
    // empty
  }
}
