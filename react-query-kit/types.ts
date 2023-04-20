import type {
  InfiniteData,
  MutationFunction,
  MutationKey,
  QueryFunction,
  QueryKeyHashFunction,
  SetDataOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import type { Updater } from '@tanstack/react-query'

export type QueryKitKey<TVariables> = TVariables extends void
  ? [string]
  : [string, TVariables]

export type AdditionalCreateOptions<TFnData, TVariables, TPageParam = never> = {
  primaryKey: string
  queryFn: QueryFunction<TFnData, QueryKitKey<TVariables>, TPageParam>
  enabled?:
    | boolean
    | ((data: TFnData | undefined, variables: TVariables) => boolean)
}

export type AdditionalQueryHookOptions<
  TFnData,
  TVariables,
  TOptVariables = TVariables
> = {
  enabled?:
    | boolean
    | ((data: TFnData | undefined, variables: TVariables) => boolean)
} & (TOptVariables extends void
  ? {
      variables?: TVariables
    }
  : {
      variables: TVariables
    })

type PartialQueryKitKey<TVariables> = TVariables extends Record<any, any>
  ?
      | {
          [P in keyof TVariables]?: TVariables[P]
        }
      | void
  : TVariables | void

export type ExposeMethods<TFnData, TVariables, TPageParam = never> = {
  getPrimaryKey: () => string
  getKey: <V extends PartialQueryKitKey<TVariables> | void = void>(
    variables?: V
  ) => QueryKitKey<V>
  queryFn: QueryFunction<TFnData, QueryKitKey<TVariables>, TPageParam>
  queryKeyHashFn: QueryKeyHashFunction<QueryKitKey<TVariables>>
}

export type QueryHookOptions<
  TFnData,
  Error,
  TData,
  TVariables,
  TOptVariables = TVariables
> = Omit<
  UseQueryOptions<TFnData, Error, TData, QueryKitKey<TVariables>>,
  'queryKey' | 'queryFn' | 'queryKeyHashFn' | 'enabled'
> &
  AdditionalQueryHookOptions<TFnData, TVariables, TOptVariables>

export interface QueryHook<
  TFnData,
  TVariables,
  Error,
  TOptVariables = TVariables
> extends ExposeMethods<TFnData, TVariables> {
  <TData = TFnData>(
    options: TOptVariables extends void
      ? QueryHookOptions<
          TFnData,
          Error,
          TData,
          TVariables,
          TOptVariables
        > | void
      : QueryHookOptions<TFnData, Error, TData, TVariables, TOptVariables>
  ): UseQueryResult<TData, Error> & {
    queryKey: QueryKitKey<TVariables>
    setData: (
      updater: Updater<TFnData | undefined, TFnData>,
      options?: SetDataOptions | undefined
    ) => TFnData | undefined
  }
}

export type InfiniteQueryHookOptions<
  TFnData,
  Error,
  TVariables,
  TOptVariables = TVariables,
  TPageParam = number
> = Omit<
  UseInfiniteQueryOptions<
    TFnData,
    Error,
    InfiniteData<TFnData>,
    TFnData,
    QueryKitKey<TVariables>,
    TPageParam
  >,
  | 'queryKey'
  | 'queryFn'
  | 'queryKeyHashFn'
  | 'enabled'
  | 'defaultPageParam'
  | 'getPreviousPageParam'
  | 'getNextPageParam'
> &
  AdditionalQueryHookOptions<TFnData, TVariables, TOptVariables>

export interface InfiniteQueryHook<
  TFnData,
  TVariables,
  Error = unknown,
  TOptVariables = TVariables,
  TPageParam = number
> extends ExposeMethods<TFnData, TVariables, TPageParam> {
  <TData = InfiniteData<TFnData>>(
    options: TOptVariables extends void
      ? InfiniteQueryHookOptions<
          TFnData,
          Error,
          TVariables,
          TOptVariables,
          TPageParam
        > | void
      : InfiniteQueryHookOptions<
          TFnData,
          Error,
          TVariables,
          TOptVariables,
          TPageParam
        >
  ): UseInfiniteQueryResult<TData, Error> & {
    queryKey: QueryKitKey<TVariables>
    setData: (
      updater: Updater<TData | undefined, TData | undefined>,
      options?: SetDataOptions
    ) => TData | undefined
  }
}

export type MutationHookOptions<TData, TError, TVariables, TContext> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn' | 'mutationKey'
>

export interface MutationHook<TData, TError, TVariables> {
  <TContext>(
    options?: MutationHookOptions<TData, TError, TVariables, TContext>
  ): UseMutationResult<TData, TError, TVariables, TContext>
  getKey: () => MutationKey | undefined
  mutationFn: MutationFunction<TData, TVariables>
}

export type inferVariables<T> = T extends QueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends InfiniteQueryHook<any, infer TVariables, any>
  ? TVariables
  : T extends MutationHook<any, any, infer TVariables>
  ? TVariables
  : never

export type inferData<T> = T extends QueryHook<infer TData, any, any>
  ? TData
  : T extends InfiniteQueryHook<infer TData, any, any>
  ? InfiniteData<TData>
  : T extends MutationHook<infer TData, any, any>
  ? TData
  : never

export type inferFnData<T> = T extends QueryHook<infer TData, any, any>
  ? TData
  : T extends InfiniteQueryHook<infer TData, any, any>
  ? TData
  : T extends MutationHook<infer TData, any, any>
  ? TData
  : never
