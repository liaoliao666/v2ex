import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

export const navNodesAtom = atomWithStorage<
  {
    title: string
    nodeNames: string[]
  }[]
>('navNodes', [], storage)
