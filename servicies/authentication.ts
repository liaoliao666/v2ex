import CookieManager from '@react-native-cookies/cookies'
import { load } from 'cheerio'
import { createMutation, createQuery } from 'react-query-kit'

import { request } from '@/utils/request'
import { baseURL } from '@/utils/request/baseURL'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

import { isLogined, updateStoreWithData } from './helper'

export const useSignout = createMutation<void, { once: string }>(
  async ({ once }) => {
    const { data } = await request.get(`/signout?once=${once}`, {
      responseType: 'text',
    })
    const $ = load(data)

    if (isLogined($)) {
      return Promise.reject(new Error('Failed to logout'))
    }
  }
)

export const useSigninInfo = createQuery(
  'useSigninInfo',
  async ({ signal }) => {
    const { data } = await request.get(`/signin`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    const captcha = $('#captcha-image').attr('src')

    return {
      is_limit: !captcha,
      captcha: `${captcha}?now=${Date.now()}`,
      once: $(
        '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(4) > td:nth-child(2) > input[type=hidden]:nth-child(1)'
      ).attr('value'),
      username_hash: $(
        '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(1) > td:nth-child(2) > input'
      ).attr('name'),
      password_hash: $(
        '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(2) > td:nth-child(2) > input'
      ).attr('name'),
      code_hash: $(
        '#Main > div.box > div.cell > form > table > tbody > tr:nth-child(3) > td:nth-child(2) > input'
      ).attr('name'),
    }
  },
  {
    cacheTime: 0,
    staleTime: 0,
  }
)

export const useSignin = createMutation<void, Record<string, string>, Error>(
  async args => {
    const response = await fetch(`${baseURL}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: `${baseURL}/signin`,
        'User-Agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36`,
        origin: baseURL,
      },
      body: paramsSerializer(args),
    })

    const { headers } = response

    const data = await response.text()

    updateStoreWithData(data)

    const $ = load(data)

    if (isLogined($)) {
      return CookieManager.setFromResponse(
        baseURL,
        headers.get('set-cookie')!
      ).then(value =>
        value ? Promise.resolve() : Promise.reject(new Error(`登录失败`))
      )
    }

    return Promise.reject(
      new Error(
        `${
          $(`#Main > div.box > div.problem > ul > li`).eq(0).text().trim() ||
          '登录失败'
        }`
      )
    )
  }
)
