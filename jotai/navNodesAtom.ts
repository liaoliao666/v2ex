import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 节点导航
 */
export const navNodesAtom = atomWithStorage<
  {
    title: string
    nodeNames: string[]
  }[]
>('navNodes', [], storage)
