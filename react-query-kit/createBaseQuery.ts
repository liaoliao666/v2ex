import type { SetDataOptions, UseBaseQueryOptions } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { Updater } from '@tanstack/react-query'

import type {
  AdditionalCreateOptions,
  AdditionalQueryHookOptions,
} from './types'

interface CreateQueryOptions
  extends Omit<UseBaseQueryOptions, 'queryKey' | 'queryFn' | 'enabled'>,
    AdditionalCreateOptions<any, any> {
  useDefaultOptions?: () => QueryBaseHookOptions
}

type QueryBaseHookOptions = Omit<
  UseBaseQueryOptions,
  'queryKey' | 'queryFn' | 'enabled'
> &
  AdditionalQueryHookOptions<any, any>

export function createBaseQuery(
  options: any,
  useRQHook: (options: any) => any
): any {
  const {
    primaryKey,
    queryFn,
    queryKeyHashFn,
    useDefaultOptions,
    ...defaultOptions
  } = options as CreateQueryOptions

  const getPrimaryKey = () => primaryKey

  const getKey = (variables?: any) =>
    typeof variables === 'undefined' ? [primaryKey] : [primaryKey, variables]

  const useGeneratedQuery = ({
    variables,
    ...currOptions
  }: QueryBaseHookOptions = {}) => {
    const { select: _select, ...prevOptions } = {
      ...defaultOptions,
      ...useDefaultOptions?.(),
    }

    const queryKey = getKey(variables)

    const { enabled, ...mergedOptions } = {
      ...prevOptions,
      ...currOptions,
      queryKeyHashFn,
      queryFn,
      queryKey,
    }

    const queryClient = useQueryClient({ context: mergedOptions.context })

    const setData = (
      updater: Updater<any, any>,
      setDataOptions?: SetDataOptions
    ) => queryClient.setQueryData(queryKey, updater, setDataOptions)

    const result = useRQHook({
      ...mergedOptions,
      enabled:
        typeof enabled === 'function'
          ? enabled(queryClient.getQueryData(queryKey), variables)
          : enabled,
    })

    return Object.assign(result, { queryKey, setData })
  }

  return Object.assign(useGeneratedQuery, {
    getPrimaryKey,
    getKey,
    queryFn,
    queryKeyHashFn,
  })
}
