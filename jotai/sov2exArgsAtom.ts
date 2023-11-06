import { z } from 'zod'

import { Sov2exArgs } from '@/servicies/other'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 搜索条件持久化
 */
export const sov2exArgsAtom = atomWithAsyncStorage<z.infer<typeof Sov2exArgs>>(
  'sov2exArgs',
  {
    size: 20,
    sort: 'created',
    order: '0',
    source: 'sov2ex',
  }
)
