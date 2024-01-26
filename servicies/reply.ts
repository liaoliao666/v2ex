import { router } from 'react-query-kit'

import { request } from '@/utils/request'

export const replyRouter = router(`reply`, {
  thank: router.mutation<void, { id: number; once: string }>({
    mutationFn: ({ id, once }) =>
      request.post(`/thank/reply/${id}?once=${once}`),
  }),

  ignore: router.mutation<void, { id: number; once: string }>({
    mutationFn: ({ id, once }) =>
      request.post(`/ignore/reply/${id}?once=${once}`),
  }),
})
