import { mutation } from 'quaere'

import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { request } from '@/utils/request'

export const resetBlockersMutation = mutation({
  fetcher: () =>
    request.get(`/settings/reset/blocked?once=${store.get(profileAtom)?.once}`),
})

export const resetIgnoredTopicsMutation = mutation({
  fetcher: () =>
    request.get(
      `/settings/reset/ignored_topics?once=${store.get(profileAtom)?.once}`
    ),
})
