import axios from 'axios'
import { CheerioAPI, load } from 'cheerio'
import { RESET } from 'jotai/utils'
import { isEqual } from 'lodash-es'

import { pcUserAgent } from '@/components/V2exWebview/helper'
import v2exMessage from '@/components/V2exWebview/v2exMessage'
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { recentTopicsAtom } from '@/jotai/recentTopicsAtom'
import { store } from '@/jotai/store'
import {
  parseNavAtoms,
  parseProfile,
  parseRecentTopics,
} from '@/servicies/helper'

import { baseURL } from './baseURL'

export const request = axios.create({
  baseURL,
  headers: {
    'Referrer-Policy': 'unsafe-url',
    'X-Requested-With': 'XMLHttpRequest',
    'cache-control': 'max-age=0',
    'user-agent': pcUserAgent,
  },
  adapter: v2exMessage.sendMessage,
})

request.interceptors.response.use(
  response => {
    const { data } = response

    if (typeof data !== 'string') return response

    const $ = load(data)

    try {
      updateProfile($)
      updateNavNodes($)
      updateRecentTopics($)
    } catch (error) {
      // empty
    }

    return response
  },
  function (error) {
    return Promise.reject(error)
  }
)

function updateProfile($: CheerioAPI) {
  const hasProfile = !!$('#Rightbar #money').length
  if (hasProfile) {
    const newProfile = parseProfile($)

    store.set(profileAtom, prev =>
      isEqual(newProfile, prev) ? prev : newProfile
    )
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

  const newNavAtoms = parseNavAtoms($)
  store.set(navNodesAtom, prev =>
    isEqual(newNavAtoms, prev) ? prev : newNavAtoms
  )
}

function updateRecentTopics($: CheerioAPI) {
  if ($(`#my-recent-topics`).length) {
    store.set(recentTopicsAtom, parseRecentTopics($))
  }
}
