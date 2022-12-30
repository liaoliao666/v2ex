import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { ComponentType, FC, ReactNode } from 'react'
import { Suspense } from 'react'
import type { ErrorBoundaryProps, FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { Text, View } from 'react-native'
import { isObject } from 'twrnc/dist/esm/types'

import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'

import LoadingIndicator from './LoadingIndicator'
import StyledButton from './StyledButton'
import v2exMessage from './V2exWebview/v2exMessage'

export type QuerySuspenseProps = Partial<ErrorBoundaryProps> & {
  Loading?: FC
  children?: ReactNode
}

export function FallbackComponent({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  async function reset() {
    try {
      await v2exMessage.loadV2exWebviewPromise
      if (v2exMessage.timeout) v2exMessage.reloadWebview()
    } catch {
      v2exMessage.reloadWebview()
    }

    resetErrorBoundary()
  }

  return (
    <View style={tw`flex-1 p-8`}>
      <Text style={tw`text-[31px] leading-9 font-extrabold text-tint-primary`}>
        {isObject(error) && error.code
          ? (error as unknown as AxiosError).code || error.name
          : error.name || '出现错误了'}
      </Text>
      <Text style={tw`text-body-5 text-tint-secondary mt-2`}>
        {isObject(error) && error.message}
      </Text>
      <StyledButton
        style={tw`h-[52px] mt-7`}
        onPress={reset}
        size="large"
        shape="rounded"
      >
        重试
      </StyledButton>

      <StyledButton
        onPress={async () => {
          try {
            await confirm(`确认清除缓存吗？`, `该动作会导致删除所有缓存数据`)
            queryClient.removeQueries()
            reset()
          } catch {
            // empty
          }
        }}
        style={tw`h-[52px] mt-7`}
        ghost
        size="large"
        shape="rounded"
      >
        {`清除缓存(非必要勿点)`}
      </StyledButton>
    </View>
  )
}

export const QuerySuspense: React.FC<QuerySuspenseProps> = ({
  Loading = LoadingIndicator,
  children,
  ...rest
}) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        // @ts-ignored
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={
            !rest.fallback && !rest.fallbackRender && !rest.FallbackComponent
              ? FallbackComponent
              : undefined
          }
          {...rest}
        >
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

export function withQuerySuspense<P>(
  Component: ComponentType<P>,
  querySuspenseProps?: QuerySuspenseProps
): ComponentType<P> {
  const Wrapped: ComponentType<P> = props => {
    return (
      <QuerySuspense {...querySuspenseProps}>
        {/* @ts-ignore */}
        <Component {...props} />
      </QuerySuspense>
    )
  }

  // Format for display in DevTools
  const name = Component.displayName || Component.name || 'Unknown'
  Wrapped.displayName = `withQuerySuspense(${name})`

  return Wrapped
}
