import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export type HomeTab = {
  title: string
  key: string
}

export const blackListAtom = atomWithAsyncStorage<{
  ignoredTopics: number[]
  blockers: number[]
}>('blackList', {
  ignoredTopics: [],
  blockers: [],
})
