import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import type { MutationHook, MutationHookOptions } from './types'

interface CreateMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  useDefaultOptions?: () => MutationHookOptions<
    TData,
    TError,
    TVariables,
    TContext
  >
}

export function createMutation<
  TData = unknown,
  TVariables = void,
  TError = unknown,
  TContext = unknown
>({
  useDefaultOptions,
  ...defaultOptions
}: CreateMutationOptions<TData, TError, TVariables, TContext>): MutationHook<
  TData,
  TError,
  TVariables
> {
  const getKey = () => defaultOptions.mutationKey

  const useGeneratedMutation = (
    options?: MutationHookOptions<TData, TError, TVariables, TContext>
  ) => {
    return useMutation({
      ...defaultOptions,
      ...useDefaultOptions?.(),
      ...options,
    })
  }

  return Object.assign(useGeneratedMutation, {
    getKey,
    mutationFn: defaultOptions.mutationFn,
  }) as MutationHook<TData, TError, TVariables>
}
