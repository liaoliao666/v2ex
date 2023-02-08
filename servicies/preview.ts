import { createQuery } from 'react-query-kit'

import { request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

export const usePreview = createQuery<
  string,
  {
    text: string
    syntax: 'default' | 'markdown'
  }
>(
  'usePreview',
  async ({ signal, queryKey: [_, { text, syntax }] }) => {
    const { data } = await request.post(
      `/preview/${syntax}`,
      paramsSerializer({ text }),
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        signal,
        responseType: 'text',
      }
    )
    return data
  },
  {
    cacheTime: 10 * 60 * 10,
    staleTime: 10 * 60 * 10,
  }
)
