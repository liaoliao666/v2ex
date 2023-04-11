import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 节点导航
 */
export const navNodesAtom = atomWithAsyncStorage<
  {
    title: string
    nodeNames: string[]
  }[]
>('navNodes', [])
