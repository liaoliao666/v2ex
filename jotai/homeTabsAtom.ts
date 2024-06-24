import { atom } from 'jotai'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const RECENT_TAB_KEY = 'recent'
export const XNA_KEY = 'xna'

export type HomeTab = {
  title: string
  key: string
  type: 'tab' | 'node' | typeof RECENT_TAB_KEY | typeof XNA_KEY
}

export const allTabs = [
  { title: '最近', key: RECENT_TAB_KEY, type: RECENT_TAB_KEY },
  { title: '最热', key: 'hot' },
  { title: '技术', key: 'tech' },
  { title: '创意', key: 'creative' },
  { title: '好玩', key: 'play' },
  { title: 'Apple', key: 'apple' },
  { title: '酷工作', key: 'jobs' },
  { title: '交易', key: 'deals' },
  { title: '城市', key: 'city' },
  { title: '问与答', key: 'qna' },
  { title: '全部', key: 'all' },
  { title: 'R2', key: 'r2' },
  { title: 'VXNA', key: XNA_KEY, type: XNA_KEY },
  { title: '节点', key: 'nodes' },
  { title: '关注', key: 'members' },
  { title: '刚更新', key: 'changes' },
].map(item => ({ ...item, type: item.type ?? 'tab' })) as HomeTab[]

export const homeTabsAtom = atomWithAsyncStorage<HomeTab[]>('tabs', allTabs)

export const homeTabIndexAtom = atom(0)
