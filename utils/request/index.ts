import axios from 'axios'
import dayjs from 'dayjs'

import { open503UrlTimeAtom } from '@/jotai/open503UrlTimeAtom'
import { store } from '@/jotai/store'
import { updateStoreWithData } from '@/servicies/helper'

import { openURL } from '../url'
import { baseURL } from './baseURL'

export const request = axios.create({
  baseURL,
})

request.interceptors.request.use(config => {
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
    return response
  },
  async error => {
    if (error.message.includes(`503`) && !error.config.url.startsWith('http')) {
      const open503UrlTime = await store.get(open503UrlTimeAtom)
      if (dayjs().diff(open503UrlTime, 'day') > 1) {
        store.set(open503UrlTimeAtom, Date.now())
        openURL(`${baseURL}${error.config.url}`)
      }
    }
    return Promise.reject(error)
  }
)
