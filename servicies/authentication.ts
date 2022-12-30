import { load } from 'cheerio'
import { isArray } from 'lodash-es'
import { createMutation, createQuery } from 'react-query-kit'

import { request } from '@/utils/request'
import { baseURL } from '@/utils/request/baseURL'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

import { isLogined } from './helper'

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
      captcha: `${captcha}?timestamp=${Date.now()}`,
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
  }
)

export const useSignin = createMutation<string, Record<string, string>, Error>(
  async args => {
    const { headers, data } = await request.post(
      '/signin',
      paramsSerializer(args),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          origin: baseURL,
          Referer: `${baseURL}/signin`,
        },
      }
    )

    const $ = load(data)

    const cookie = isArray(headers['set-cookie'])
      ? headers['set-cookie'].join(';')
      : ''
    return isLogined($)
      ? Promise.resolve(cookie)
      : Promise.reject(
          new Error(
            $(`#Main > div.box > div.problem > ul > li`).eq(0).text().trim() ||
              '登录失败'
          )
        )
  }
)
