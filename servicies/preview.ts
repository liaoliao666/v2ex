import { query } from 'quaere'

import { request } from '@/utils/request'
import { paramsSerializer } from '@/utils/request/paramsSerializer'

export const previewQuery = query<
  string,
  {
    text: string
    syntax: 'default' | 'markdown'
  }
>({
  key: 'preview',
  fetcher: async ({ text, syntax }, { signal }) => {
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
  gcTime: 10 * 60 * 10,
  staleTime: 10 * 60 * 10,
})
