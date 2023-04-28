import { load } from 'cheerio'
import { defaultTo } from 'lodash-es'
import { createInfiniteQuery, createMutation } from 'react-query-kit'

import { request } from '@/utils/request'

import { getNextPageParam, parseLastPage, parseTopicByATag } from './helper'
import { Member, Notice, PageData, Topic } from './types'

export const useNotifications = createInfiniteQuery<PageData<Notice>, void>({
  primaryKey: 'useNotifications',
  queryFn: async ({ pageParam, signal }) => {
    const { data } = await request.get(`/notifications?p=${pageParam}`, {
      responseType: 'text',
      signal,
    })
    const $ = load(data)

    return {
      page: pageParam,
      last_page: parseLastPage($),
      list: $('#notifications .cell')
        .map((i, cell) => {
          const $td = $(cell).find('tr').eq(0).find('td')
          const $avatar = $td.find('a > img')

          return {
            id: Number($(cell).attr('id')?.replace('n_', '').trim()),
            once: defaultTo(
              $td
                .eq(1)
                .find('.node')
                .attr('onclick')
                ?.match(/,\s(\d+)\)/)?.[1],
              undefined
            ),
            member: {
              username: $avatar.attr('alt'),
              avatar: $avatar.attr('src'),
            } as Member,
            topic: parseTopicByATag($td.eq(1).find('a').eq(1)) as Topic,
            prev_action_text: (
              $td.eq(1).find('a').eq(0).get(0)?.nextSibling as any
            )?.nodeValue?.trimLeft(),
            next_action_text: (
              $td.eq(1).find('a').eq(1).get(0)?.nextSibling as any
            )?.nodeValue as string,
            created: $td.eq(1).find('.snow').text(),
            content: $td.eq(1).find('.payload').html(),
          } as Notice
        })
        .get(),
    }
  },
  defaultPageParam: 1,
  getNextPageParam,
  structuralSharing: false,
})

export const useDeleteNotice = createMutation<
  void,
  { id: number; once: string }
>({
  mutationFn: ({ id, once }) =>
    request.post(`/delete/notification/${id}?once=${once}`, {
      responseType: 'text',
    }),
})
