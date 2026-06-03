import {
  ReactElement,
  ReactNode,
  Ref,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  Easing,
  StyleProp,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native'
import {
  Route,
  SceneRendererProps,
  TabView,
  TabViewProps,
} from 'react-native-tab-view'

const SCROLL_DELTA_THRESHOLD = 0.5

export type CollapsibleTabViewListScrollProps = {
  onScroll: (event: any) => void
  onScrollBeginDrag: () => void
  onScrollEndDrag: () => void
  onMomentumScrollEnd: () => void
  scrollEventThrottle: number
  contentTopPadding: number
}

export type CollapsibleTabViewHandle = {
  resetRouteScroll: (routeKey: string) => void
  syncRoute: (routeKey: string, keepHidden?: boolean) => void
}

type TabBarRendererProps<T extends Route> = Parameters<
  NonNullable<TabViewProps<T>['renderTabBar']>
>[0]

type CollapsibleTabViewSceneProps<T extends Route> = SceneRendererProps & {
  route: T
  contentTopPadding: number
  headerHeight: number
  listScrollProps: CollapsibleTabViewListScrollProps
}

type CollapsibleTabViewRenderHelpers = {
  changeIndex: (index: number, forceFetch?: boolean) => void
  contentTopPadding: number
  headerHeight: number
  topBarTranslateY: Animated.AnimatedInterpolation<number>
}

export type CollapsibleTabViewProps<T extends Route> = Omit<
  TabViewProps<T>,
  | 'initialLayout'
  | 'onIndexChange'
  | 'renderLazyPlaceholder'
  | 'renderScene'
  | 'renderTabBar'
> & {
  bottomScrollLockDistance?: number
  collapsibleHeight: number
  headerContainerStyle?: StyleProp<ViewStyle>
  headerHeight: number
  initialLayout?: TabViewProps<T>['initialLayout']
  onIndexChange: (index: number, forceFetch?: boolean) => void
  renderLazyPlaceholder?: (props: {
    contentTopPadding: number
    headerHeight: number
    route: T
  }) => ReactNode
  renderScene: (props: CollapsibleTabViewSceneProps<T>) => ReactNode
  renderTabBar: (
    props: TabBarRendererProps<T>,
    helpers: CollapsibleTabViewRenderHelpers
  ) => ReactNode
  renderTopBar: () => ReactNode
  topSafeAreaOverlayStyle?: StyleProp<ViewStyle>
}

function getEffectiveScrollOffset(event: any) {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
  const rawOffset = contentOffset.y
  const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height)
  const offset = Math.max(0, Math.min(rawOffset, maxOffset))
  const distanceToBottom = Math.max(0, maxOffset - offset)

  return {
    distanceToBottom,
    isBottomBounce: rawOffset > maxOffset,
    maxOffset,
    offset,
  }
}

function CollapsibleTabViewInner<T extends Route>(
  {
    bottomScrollLockDistance,
    collapsibleHeight,
    headerContainerStyle,
    headerHeight,
    initialLayout,
    navigationState,
    onIndexChange,
    renderLazyPlaceholder,
    renderScene,
    renderTabBar,
    renderTopBar,
    topSafeAreaOverlayStyle,
    ...props
  }: CollapsibleTabViewProps<T>,
  ref: Ref<CollapsibleTabViewHandle>
) {
  const layout = useWindowDimensions()
  const topBarCollapseY = useRef(new Animated.Value(0)).current
  const topBarCollapseValueRef = useRef(0)
  const topBarAnimationRef = useRef<Animated.CompositeAnimation | null>(null)
  const lastScrollDirectionRef = useRef(0)
  const activeRouteKeyRef = useRef(
    navigationState.routes[navigationState.index]?.key
  )
  const bottomBounceRouteMapRef = useRef<Record<string, boolean>>({})
  const scrollToTopRouteMapRef = useRef<Record<string, boolean>>({})
  const routeDistanceToBottomMapRef = useRef<Record<string, number>>({})
  const routeScrollOffsetMapRef = useRef<Record<string, number>>({})
  const [isTopBarCollapsed, setIsTopBarCollapsed] = useState(false)
  const lockDistance = bottomScrollLockDistance ?? collapsibleHeight * 2
  const topBarTranslateY = topBarCollapseY.interpolate({
    inputRange: [0, collapsibleHeight],
    outputRange: [0, -collapsibleHeight],
    extrapolate: 'clamp',
  })
  const contentTopPadding = isTopBarCollapsed
    ? headerHeight - collapsibleHeight
    : headerHeight

  const updateTopBarCollapse = useCallback(
    (value: number) => {
      topBarAnimationRef.current?.stop()
      topBarAnimationRef.current = null

      const nextValue = Math.max(0, Math.min(value, collapsibleHeight))
      if (topBarCollapseValueRef.current === nextValue) return

      topBarCollapseValueRef.current = nextValue
      setIsTopBarCollapsed(nextValue >= collapsibleHeight)
      topBarCollapseY.setValue(nextValue)
    },
    [collapsibleHeight, topBarCollapseY]
  )

  const animateTopBarCollapse = useCallback(
    (targetValue: number) => {
      const nextValue = Math.max(0, Math.min(targetValue, collapsibleHeight))
      if (topBarCollapseValueRef.current === nextValue) return

      topBarAnimationRef.current?.stop()
      topBarCollapseValueRef.current = nextValue
      setIsTopBarCollapsed(nextValue >= collapsibleHeight)

      const animation = Animated.timing(topBarCollapseY, {
        toValue: nextValue,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })

      topBarAnimationRef.current = animation
      animation.start(() => {
        if (topBarAnimationRef.current === animation) {
          topBarAnimationRef.current = null
        }
        topBarCollapseValueRef.current = nextValue
      })
    },
    [collapsibleHeight, topBarCollapseY]
  )

  const snapTopBarCollapse = useCallback(
    (routeKey: string) => {
      if (activeRouteKeyRef.current !== routeKey) return

      const distanceToBottom =
        routeDistanceToBottomMapRef.current[routeKey] ??
        Number.POSITIVE_INFINITY
      if (distanceToBottom <= lockDistance) return

      const offset = routeScrollOffsetMapRef.current[routeKey] || 0
      const currentValue = topBarCollapseValueRef.current
      let targetValue: number

      if (offset < collapsibleHeight) {
        targetValue = 0
      } else if (lastScrollDirectionRef.current > 0) {
        targetValue = collapsibleHeight
      } else if (lastScrollDirectionRef.current < 0) {
        targetValue = 0
      } else {
        targetValue =
          currentValue >= collapsibleHeight / 2 ? collapsibleHeight : 0
      }

      animateTopBarCollapse(targetValue)
    },
    [animateTopBarCollapse, collapsibleHeight, lockDistance]
  )

  const syncRoute = useCallback(
    (routeKey: string, keepHidden = false) => {
      if (
        keepHidden &&
        topBarCollapseValueRef.current >= collapsibleHeight - 1
      ) {
        updateTopBarCollapse(collapsibleHeight)
        return
      }

      const offset = routeScrollOffsetMapRef.current[routeKey] || 0
      updateTopBarCollapse(offset < collapsibleHeight ? 0 : collapsibleHeight)
    },
    [collapsibleHeight, updateTopBarCollapse]
  )

  const resetRouteScroll = useCallback(
    (routeKey: string) => {
      bottomBounceRouteMapRef.current[routeKey] = false
      scrollToTopRouteMapRef.current[routeKey] = true
      routeDistanceToBottomMapRef.current[routeKey] = Number.POSITIVE_INFINITY
      routeScrollOffsetMapRef.current[routeKey] = 0

      if (activeRouteKeyRef.current === routeKey) {
        lastScrollDirectionRef.current = 0
        updateTopBarCollapse(0)
      }
    },
    [updateTopBarCollapse]
  )

  const changeIndex = useCallback(
    (nextIndex: number, forceFetch = false) => {
      const nextRoute = navigationState.routes[nextIndex]
      if (!nextRoute) return

      activeRouteKeyRef.current = nextRoute.key
      syncRoute(nextRoute.key, true)
      onIndexChange(nextIndex, forceFetch)
    },
    [navigationState.routes, onIndexChange, syncRoute]
  )

  const getListScrollProps = useCallback(
    (routeKey: string): CollapsibleTabViewListScrollProps => ({
      onScroll: event => {
        const { distanceToBottom, isBottomBounce, maxOffset, offset } =
          getEffectiveScrollOffset(event)
        const previousOffset = routeScrollOffsetMapRef.current[routeKey] ?? 0
        const delta = offset - previousOffset

        routeDistanceToBottomMapRef.current[routeKey] = distanceToBottom

        if (scrollToTopRouteMapRef.current[routeKey]) {
          routeScrollOffsetMapRef.current[routeKey] = offset

          if (offset <= SCROLL_DELTA_THRESHOLD) {
            scrollToTopRouteMapRef.current[routeKey] = false
            lastScrollDirectionRef.current = 0
          }

          if (activeRouteKeyRef.current === routeKey) {
            updateTopBarCollapse(0)
          }
          return
        }

        if (isBottomBounce || bottomBounceRouteMapRef.current[routeKey]) {
          bottomBounceRouteMapRef.current[routeKey] = true
          routeDistanceToBottomMapRef.current[routeKey] = 0
          routeScrollOffsetMapRef.current[routeKey] = maxOffset
          return
        }

        routeScrollOffsetMapRef.current[routeKey] = offset

        if (activeRouteKeyRef.current !== routeKey) return
        if (distanceToBottom <= lockDistance) return

        if (Math.abs(delta) > SCROLL_DELTA_THRESHOLD) {
          lastScrollDirectionRef.current = delta > 0 ? 1 : -1
        }

        if (delta < -SCROLL_DELTA_THRESHOLD) {
          animateTopBarCollapse(0)
          return
        }

        if (delta > SCROLL_DELTA_THRESHOLD && offset >= collapsibleHeight) {
          animateTopBarCollapse(collapsibleHeight)
        }
      },
      onScrollBeginDrag: () => {
        bottomBounceRouteMapRef.current[routeKey] = false
        scrollToTopRouteMapRef.current[routeKey] = false
      },
      onScrollEndDrag: () => {
        if (scrollToTopRouteMapRef.current[routeKey]) return
        if (bottomBounceRouteMapRef.current[routeKey]) return
        snapTopBarCollapse(routeKey)
      },
      onMomentumScrollEnd: () => {
        if (scrollToTopRouteMapRef.current[routeKey]) {
          scrollToTopRouteMapRef.current[routeKey] = false
          lastScrollDirectionRef.current = 0
          return
        }
        if (bottomBounceRouteMapRef.current[routeKey]) {
          bottomBounceRouteMapRef.current[routeKey] = false
          return
        }
        snapTopBarCollapse(routeKey)
      },
      scrollEventThrottle: 16,
      contentTopPadding,
    }),
    [
      animateTopBarCollapse,
      collapsibleHeight,
      contentTopPadding,
      lockDistance,
      snapTopBarCollapse,
      updateTopBarCollapse,
    ]
  )

  useImperativeHandle(
    ref,
    () => ({
      resetRouteScroll,
      syncRoute,
    }),
    [resetRouteScroll, syncRoute]
  )

  useEffect(() => {
    const activeRouteKey = navigationState.routes[navigationState.index]?.key
    if (!activeRouteKey) return

    activeRouteKeyRef.current = activeRouteKey
    syncRoute(activeRouteKey, true)
  }, [navigationState.index, navigationState.routes, syncRoute])

  return (
    <TabView
      {...props}
      initialLayout={initialLayout ?? { width: layout.width }}
      navigationState={navigationState}
      onIndexChange={changeIndex}
      renderLazyPlaceholder={
        renderLazyPlaceholder
          ? lazyPlaceholderProps =>
              renderLazyPlaceholder({
                ...lazyPlaceholderProps,
                contentTopPadding,
                headerHeight,
              })
          : undefined
      }
      renderScene={sceneProps =>
        renderScene({
          ...sceneProps,
          contentTopPadding,
          headerHeight,
          listScrollProps: getListScrollProps(sceneProps.route.key),
        })
      }
      renderTabBar={tabBarProps => (
        <View style={headerContainerStyle}>
          <Animated.View
            style={{
              transform: [{ translateY: topBarTranslateY }],
            }}
          >
            {renderTopBar()}
          </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateY: topBarTranslateY }],
            }}
          >
            {renderTabBar(tabBarProps, {
              changeIndex,
              contentTopPadding,
              headerHeight,
              topBarTranslateY,
            })}
          </Animated.View>

          {topSafeAreaOverlayStyle ? (
            <View pointerEvents="none" style={topSafeAreaOverlayStyle} />
          ) : null}
        </View>
      )}
    />
  )
}

export const CollapsibleTabView = forwardRef(CollapsibleTabViewInner) as <
  T extends Route
>(
  props: CollapsibleTabViewProps<T> & {
    ref?: Ref<CollapsibleTabViewHandle>
  }
) => ReactElement
