import { createMutation } from 'react-query-kit'

import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { request } from '@/utils/request'

export const useResetBlockers = createMutation({
  mutationFn: () =>
    request.get(`/settings/reset/blocked?once=${store.get(profileAtom)?.once}`),
})

export const useResetIgnoredTopics = createMutation({
  mutationFn: () =>
    request.get(
      `/settings/reset/ignored_topics?once=${store.get(profileAtom)?.once}`
    ),
})
