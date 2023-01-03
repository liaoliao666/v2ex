import axios from 'axios'

import { updateStoreWithData } from '@/servicies/helper'

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
  function (error) {
    return Promise.reject(error)
  }
)
