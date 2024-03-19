import {
  DataTag,
  QueryKey,
  hashKey,
  notifyManager,
} from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'

import { queryClient } from './query'

type Listener = () => void
const queryListeners = new Map<string, Set<Listener>>()
const queryCache = queryClient.getQueryCache()

queryCache.subscribe(({ query: { queryHash }, type }) => {
  if (queryListeners.has(queryHash) && !type.startsWith(`observer`)) {
    const listeners = queryListeners.get(queryHash)!
    listeners.forEach(l => l())
  }
})

const subscribeQuery = (queryHash: string, listener: Listener) => {
  if (!queryListeners.has(queryHash)) {
    queryListeners.set(queryHash, new Set())
  }
  const listeners = queryListeners.get(queryHash)!

  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useQueryData = <TQueryData, TData = TQueryData>(
  queryKey: DataTag<QueryKey, TQueryData>,
  select?: (data?: TQueryData) => TData
): TData => {
  const queryHash = hashKey(queryKey)
  const getSnapshot = () => {
    const data = queryCache.get(queryHash)?.state.data as TQueryData
    return (select ? select(data) : data) as TData
  }

  return useSyncExternalStore(
    useCallback(
      onStoreChange =>
        subscribeQuery(queryHash, notifyManager.batchCalls(onStoreChange)),
      [queryHash]
    ),
    getSnapshot,
    getSnapshot
  )
}
