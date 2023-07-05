import { DeepPartial } from 'react-hook-form'
import { z } from 'zod'

import { stripString } from '@/utils/zodHelper'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const topicDraftAtom = atomWithAsyncStorage<
  DeepPartial<z.infer<typeof WriteTopicArgs>>
>('topicDraft', {
  syntax: 'default',
  title: '',
  content: '',
  node: null as any,
})

export const WriteTopicArgs = z.object({
  title: z.preprocess(stripString, z.string()),
  content: z.preprocess(stripString, z.string().optional()),
  node: z.preprocess(
    stripString,
    z.object({
      title: z.string(),
      name: z.string(),
    })
  ),
  syntax: z.enum(['default', 'markdown']),
})
