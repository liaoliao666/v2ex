import { load } from 'cheerio'
import { isArray } from 'lodash-es'
import { mutation, query } from 'quaere'

import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { store } from '@/jotai/store'
import { getCookie } from '@/utils/cookie'
import { request } from '@/utils/request'
import { baseURL } from '@/utils/request/baseURL'
import { paramsSerializer } from '@/utils/request/paramsSerializer'
import { sleep } from '@/utils/sleep'

import { isLogined } from './helper'

export const signoutMutation = mutation({
  fetcher: async ({ once }: { once: string }) => {
    const { data } = await request.get(`/signout?once=${once}`, {
      responseType: 'text',
    })
    const $ = load(data)

    if (isLogined($)) {
      return Promise.reject(new Error('Failed to logout'))
    }
  },
})

export const signinInfoQuery = query({
  key: 'signinInfo',
  fetcher: async (_, { signal }) => {
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
      cookie: await getCookie(),
    }
  },
  gcTime: 0,
  staleTime: 0,
})

export const signinMutation = mutation({
  fetcher: async ({
    username,
    ...args
  }: Record<string, any>): Promise<{
    '2fa'?: boolean
    once?: string
    cookie?: string
  }> => {
    if (await store.get(deletedNamesAtom)?.includes(username)) {
      await sleep(1000)
      return Promise.reject(new Error('该帐号已注销'))
    }

    const { headers, data } = await request.post(
      '/signin',
      paramsSerializer(args),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Referer: `${baseURL}/signin`,
          origin: baseURL,
        },
      }
    )

    const $ = load(data)

    if ($('#otp_code').length) {
      return {
        '2fa': true,
        once: $("input[name='once']").attr('value'),
      }
    }

    const problem = $(`#Main > div.box > div.problem > ul > li`)
      .eq(0)
      .text()
      .trim()

    if (isLogined($) && !problem) {
      return {
        cookie: isArray(headers['set-cookie'])
          ? headers['set-cookie'].join(';')
          : '',
      }
    }

    return Promise.reject(
      new Error(
        `${
          problem ||
          ($('#captcha-image').attr('src')
            ? '登录失败'
            : '由于当前 IP 在短时间内的登录尝试次数太多，目前暂时不能继续尝试。')
        }`
      )
    )
  },
})

export const useTwoStepSignin = mutation({
  fetcher: async (args: { code: string; once: string }): Promise<string> => {
    const { headers, data } = await request.post(
      '/2fa',
      paramsSerializer(args),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Referer: `${baseURL}/2fa`,
          origin: baseURL,
        },
      }
    )

    const $ = load(data)

    const problem = $(`#Main > div.box > div.problem > ul > li`)
      .eq(0)
      .text()
      .trim()

    if (isLogined($) && !problem) {
      return isArray(headers['set-cookie'])
        ? headers['set-cookie'].join(';')
        : ''
    }

    return Promise.reject(new Error(`${problem || '登录失败'}`))
  },
})
