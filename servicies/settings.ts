import { router } from 'react-query-kit'

import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { request } from '@/utils/request'

export const settings = router(`settings`, {
  resetBlockers: router.mutation({
    mutationFn: () =>
      request.get(
        `/settings/reset/blocked?once=${store.get(profileAtom)?.once}`
      ),
  }),

  resetIgnoredTopics: router.mutation({
    mutationFn: () =>
      request.get(
        `/settings/reset/ignored_topics?once=${store.get(profileAtom)?.once}`
      ),
  }),
})
