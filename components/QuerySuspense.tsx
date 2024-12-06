import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useAtomValue } from 'jotai'
import { isObjectLike, isString } from 'lodash-es'
import type { ComponentType, FC, ReactNode } from 'react'
import { Fragment, Suspense } from 'react'
import type { ErrorBoundaryProps, FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { Text, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'

import LoadingIndicator from './LoadingIndicator'
import StyledButton from './StyledButton'

export function FallbackComponent({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const message =
    isObjectLike(error) && isString(error.message) && !!error.message
      ? error.message
      : null

  const { colors, fontSize } = useAtomValue(uiAtom)

  if (message) {
    ;(error as any).stack = null
  }

  return (
    <View style={tw`p-8`}>
      {message ? (
        <Fragment>
          <Text
            style={tw`text-[31px] leading-9 font-extrabold text-[${colors.foreground}]`}
            selectable
          >
            {(error as AxiosError).code
              ? (error as AxiosError).code || error.name
              : error.name || '出现错误了'}
          </Text>
          <Text
            style={tw`${fontSize.medium} text-[${colors.default}] mt-2`}
            selectable
          >
            {error.message}
          </Text>
        </Fragment>
      ) : (
        <Text
          style={tw`text-[31px] leading-9 font-extrabold text-[${colors.foreground}]`}
          selectable
        >
          出现错误了
        </Text>
      )}
      <StyledButton
        style={tw`h-[52px] mt-7`}
        onPress={resetErrorBoundary}
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
            resetErrorBoundary()
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

export type QuerySuspenseProps<P> = Omit<
  Partial<ErrorBoundaryProps>,
  'fallbackRender'
> & {
  LoadingComponent?: FC
  loadingRender?: (componentsProps: P) => ReactNode
  fallbackRender?: (props: FallbackProps & { componentsProps: P }) => ReactNode
  loading?: ReactNode
  children?: ReactNode
  componentsProps?: P
}

export function QuerySuspense<P = void>({
  LoadingComponent,
  loadingRender,
  loading,
  children,
  componentsProps,
  ...rest
}: QuerySuspenseProps<P>) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        // @ts-ignore
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={
            !rest.fallback && !rest.fallbackRender && !rest.FallbackComponent
              ? FallbackComponent
              : undefined
          }
          fallbackRender={
            rest.fallbackRender
              ? ((props =>
                  rest.fallbackRender?.({
                    ...props,
                    componentsProps: componentsProps!,
                  })) as ErrorBoundaryProps['fallbackRender'] as any)
              : undefined
          }
          {...rest}
        >
          <Suspense
            fallback={
              LoadingComponent ? (
                <LoadingComponent />
              ) : loadingRender ? (
                loadingRender(componentsProps!)
              ) : (
                loading ?? <LoadingIndicator />
              )
            }
          >
            {children}
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

export function withQuerySuspense<P>(
  Component: ComponentType<P>,
  querySuspenseProps?: QuerySuspenseProps<P>
): ComponentType<P> {
  const Wrapped: ComponentType<P> = props => {
    return (
      <QuerySuspense {...querySuspenseProps} componentsProps={props}>
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
