import { atomWithStorage } from 'jotai/utils'
import { z } from 'zod'

import { Sov2exArgs } from '@/servicies/sov2ex'

import { storage } from './storage'

/**
 * 搜索条件持久化
 */
export const sov2exArgsAtom = atomWithStorage<z.infer<typeof Sov2exArgs>>(
  'sov2exArgs',
  {
    size: 10,
    sort: 'sumup',
    order: '0',
  },
  storage
)
