import axios from 'axios'
import { CheerioAPI, load } from 'cheerio'
import { RESET } from 'jotai/utils'
import { isEqual } from 'lodash-es'

import { cookieAtom } from '@/jotai/cookieAtom'
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { parseNavAtoms, parseProfile } from '@/servicies/helper'

import { baseURL } from './baseURL'

export const request = axios.create({
  baseURL,
  headers: {
    'Referrer-Policy': 'unsafe-url',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

request.interceptors.request.use(
  async config => {
    return {
      ...config,
      headers: {
        ...config.headers,
        cookie: store.get(cookieAtom),
      },
    }
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const { data } = response

    if (typeof data !== 'string') return response

    const $ = load(data)

    updateProfile($)
    updateNavNodes($)

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
    $('#Rightbar a.super.normal.button').eq(0).attr('href')?.includes('signup')
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
