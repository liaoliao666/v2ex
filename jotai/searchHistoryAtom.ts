import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const searchHistoryAtom = atomWithAsyncStorage<string[]>(
  'searchHistory',
  []
)
