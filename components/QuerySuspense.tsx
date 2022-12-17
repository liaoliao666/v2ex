import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import type { ComponentType, FC, ReactNode } from 'react'
import { Suspense } from 'react'
import type { ErrorBoundaryProps, FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { Text, View } from 'react-native'
import { isObject } from 'twrnc/dist/esm/types'

import tw from '@/utils/tw'

import LoadingIndicator from './LoadingIndicator'
import StyledButton from './StyledButton'

export type QuerySuspenseProps = Partial<ErrorBoundaryProps> & {
  Loading?: FC
  children?: ReactNode
}

export function FallbackComponent({
  error,
  resetErrorBoundary,
}: FallbackProps) {
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
        onPress={resetErrorBoundary}
        size="large"
        shape="rounded"
      >
        重试
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
