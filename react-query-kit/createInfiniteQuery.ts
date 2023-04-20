import type { UseInfiniteQueryOptions } from '@tanstack/react-query'
import { useInfiniteQuery } from '@tanstack/react-query'

import { createBaseQuery } from './createBaseQuery'
import type {
  AdditionalCreateOptions,
  InfiniteQueryHook,
  InfiniteQueryHookOptions,
  QueryKitKey,
} from './types'

interface CreateInfiniteQueryOptions<TFnData, TVariables, Error, TPageParam>
  extends Omit<
      UseInfiniteQueryOptions<
        TFnData,
        Error,
        TFnData,
        TFnData,
        QueryKitKey<TVariables>,
        TPageParam
      >,
      'queryKey' | 'queryFn' | 'enabled' | 'select'
    >,
    AdditionalCreateOptions<TFnData, TVariables, TPageParam> {}

export function createInfiniteQuery<
  TFnData,
  TVariables = any,
  Error = unknown,
  TPageParam = number
>(
  options: CreateInfiniteQueryOptions<
    TFnData,
    TVariables,
    Error,
    TPageParam
  > & {
    useDefaultOptions: () => Omit<
      InfiniteQueryHookOptions<
        TFnData,
        Error,
        TVariables,
        TVariables,
        TPageParam
      >,
      'select'
    > & { variables: TVariables }
  }
): InfiniteQueryHook<TFnData, TVariables, Error, TVariables | void, TPageParam>

export function createInfiniteQuery<
  TFnData,
  TVariables = any,
  Error = unknown,
  TPageParam = number
>(
  options: CreateInfiniteQueryOptions<
    TFnData,
    TVariables,
    Error,
    TPageParam
  > & {
    useDefaultOptions: () => Omit<
      InfiniteQueryHookOptions<
        TFnData,
        Error,
        TVariables,
        TVariables,
        TPageParam
      >,
      'select' | 'variables'
    >
  }
): InfiniteQueryHook<TFnData, TVariables, Error, TVariables, TPageParam>

export function createInfiniteQuery<
  TFnData,
  TVariables = any,
  Error = unknown,
  TPageParam = number
>(
  options: CreateInfiniteQueryOptions<TFnData, TVariables, Error, TPageParam>
): InfiniteQueryHook<TFnData, TVariables, Error, TVariables, TPageParam>

export function createInfiniteQuery(options: any) {
  return createBaseQuery(options, useInfiniteQuery)
}
