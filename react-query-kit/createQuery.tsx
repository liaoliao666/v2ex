import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { createBaseQuery } from './createBaseQuery'
import type {
  AdditionalCreateOptions,
  QueryHook,
  QueryHookOptions,
  QueryKitKey,
} from './types'

interface CreateQueryOptions<TFnData, TVariables, Error>
  extends Omit<
      UseQueryOptions<TFnData, Error, TFnData, QueryKitKey<TVariables>>,
      'queryKey' | 'queryFn' | 'enabled' | 'select'
    >,
    AdditionalCreateOptions<TFnData, TVariables> {}

export function createQuery<TFnData, TVariables = any, Error = unknown>(
  options: CreateQueryOptions<TFnData, TVariables, Error> & {
    useDefaultOptions: () => Omit<
      QueryHookOptions<TFnData, Error, TFnData, TVariables>,
      'select'
    > & { variables: TVariables }
  }
): QueryHook<TFnData, TVariables, Error, TVariables | void>

export function createQuery<TFnData, TVariables = any, Error = unknown>(
  options: CreateQueryOptions<TFnData, TVariables, Error> & {
    useDefaultOptions: () => Omit<
      QueryHookOptions<TFnData, Error, TFnData, TVariables>,
      'select' | 'variables'
    >
  }
): QueryHook<TFnData, TVariables, Error, TVariables>

export function createQuery<TFnData, TVariables = any, Error = unknown>(
  options: CreateQueryOptions<TFnData, TVariables, Error>
): QueryHook<TFnData, TVariables, Error, TVariables>

export function createQuery(options: any) {
  return createBaseQuery(options, useQuery)
}
