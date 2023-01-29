import { load } from 'cheerio'
import { isArray } from 'lodash-es'
import { createMutation, createQuery } from 'react-query-kit'

import v2exMessage from '@/components/V2exWebview/v2exMessage'
import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { enabledPerformanceAtom } from '@/jotai/enabledPerformanceAtom'
import { store } from '@/jotai/store'
import { request } from '@/utils/request'
import { baseURL } from '@/utils/request/baseURL'
import { paramsSerializer } from '@/utils/request/paramsSerializer'
import { sleep } from '@/utils/sleep'

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
    if (!(await store.get(enabledPerformanceAtom))) {
      return {
        is_limit: await v2exMessage.isLimitLogin(),
      }
    }

    const { data } = await request.get(`/signin`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    const captcha = $('#captcha-image').attr('src')

    return {
      is_limit: !captcha,
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

export const useSignin = createMutation<
  {
    '2fa'?: boolean
    once?: string
    cookie?: string
  },
  Record<string, any>,
  Error
>(async ({ webviewArg, ...args }) => {
  if (await store.get(deletedNamesAtom)?.includes(webviewArg.username)) {
    await sleep(1000)
    return Promise.reject(new Error('该帐号已注销'))
  }

  if (!(await store.get(enabledPerformanceAtom))) {
    return v2exMessage.login(webviewArg) as any
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

  return Promise.reject(new Error(`${problem || '登录失败'}`))
})

export const useTwoStepSignin = createMutation<
  string,
  {
    code: string
    once: string
  },
  Error
>(async args => {
  const { headers, data } = await request.post('/2fa', paramsSerializer(args), {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Referer: `${baseURL}/2fa`,
      origin: baseURL,
    },
  })

  const $ = load(data)

  const problem = $(`#Main > div.box > div.problem > ul > li`)
    .eq(0)
    .text()
    .trim()

  if (isLogined($) && !problem) {
    return isArray(headers['set-cookie']) ? headers['set-cookie'].join(';') : ''
  }

  return Promise.reject(new Error(`${problem || '登录失败'}`))
})

export const useCaptcha = createQuery<string, void>(
  'useCaptcha',
  async () => {
    const enabledPerformance = await store.get(enabledPerformanceAtom)
    return request
      .get(`/_captcha?now=${Date.now()}`, {
        responseType: 'blob',
        ...(enabledPerformance
          ? {
              transformResponse: [
                function blobToBase64(blob) {
                  if (!blob) return blob
                  return new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result)
                    reader.onerror = reject
                    reader.readAsDataURL(blob)
                  })
                },
              ],
            }
          : {
              transformResponseScript: `function blobToBase64(blob) {
                if (!blob) return blob
                return new Promise((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result)
                  reader.onerror = reject
                  reader.readAsDataURL(blob)
                })
              }`,
            }),
      })
      .then(res => res.data)
      .catch(err => {
        throw err
      })
  },
  {
    cacheTime: 0,
    staleTime: 0,
  }
)
