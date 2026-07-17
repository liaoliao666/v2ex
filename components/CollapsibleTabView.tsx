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
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const HEADER_SYNC_HAIRLINE = 1
const HEADER_ANIMATION_DELTA_THRESHOLD = 12
const SNAP_ANIMATION_DURATION = 160
const SCROLL_END_SNAP_DELAY = 32
const SCROLL_SYNC_RETRY_COUNT = 4
const SCROLL_SYNC_RETRY_DELAY = 16

type ScrollableRef = {
  scrollTo?: (params: { animated?: boolean; y?: number }) => void
  scrollToOffset?: (params: { animated?: boolean; offset: number }) => void
}

export type CollapsibleTabViewListScrollProps = {
  contentTopPadding: number
  onContentSizeChange: (width: number, height: number) => void
  onLayout: (event: LayoutChangeEvent) => void
  onMomentumScrollBegin: () => void
  onMomentumScrollEnd: () => void
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onScrollBeginDrag: () => void
  onScrollEndDrag: () => void
  scrollEventThrottle: number
  setScrollRef: (scrollRef: ScrollableRef | null) => void
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

type RouteScrollState = {
  contentHeight: number
  layoutHeight: number
  maxOffset: number
  pendingScrollY: number | null
  ref: ScrollableRef | null
  scrollY: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function createRouteScrollState(): RouteScrollState {
  return {
    contentHeight: 0,
    layoutHeight: 0,
    maxOffset: 0,
    pendingScrollY: null,
    ref: null,
    scrollY: 0,
  }
}

function getEventScrollY(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
  const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height)

  return {
    maxOffset,
    scrollY: clamp(contentOffset.y, 0, maxOffset),
  }
}

function getScrollableTargetOffset(
  state: RouteScrollState,
  targetScrollY: number
) {
  if (state.maxOffset <= 0) return Math.max(0, targetScrollY)

  return clamp(targetScrollY, 0, state.maxOffset)
}

function scrollTo(
  scrollRef: ScrollableRef,
  scrollY: number,
  animated: boolean
) {
  if (scrollRef.scrollToOffset) {
    scrollRef.scrollToOffset({ offset: scrollY, animated })
    return
  }

  scrollRef.scrollTo?.({ y: scrollY, animated })
}

function CollapsibleTabViewInner<T extends Route>(
  {
    collapsibleHeight,
    headerContainerStyle,
    headerHeight,
    initialLayout,
    navigationState,
    onIndexChange,
    onSwipeStart,
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
  const headerOffsetY = useRef(new Animated.Value(0)).current
  const headerOffsetAnimationRef = useRef<Animated.CompositeAnimation | null>(
    null
  )
  const pendingHeaderSnapTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const activeRouteKeyRef = useRef(
    navigationState.routes[navigationState.index]?.key
  )
  const currentScrollYRef = useRef(0)
  const headerOffsetValueRef = useRef(0)
  const routeScrollStateMapRef = useRef<Record<string, RouteScrollState>>({})
  const expandedContentTopPadding = headerHeight
  const collapsedContentTopPadding = Math.max(
    0,
    headerHeight - collapsibleHeight
  )
  const [contentTopPadding, setContentTopPaddingState] = useState(
    expandedContentTopPadding
  )
  const contentTopPaddingValueRef = useRef(expandedContentTopPadding)
  const topBarTranslateY = headerOffsetY.interpolate({
    inputRange: [0, collapsibleHeight],
    outputRange: [0, -collapsibleHeight],
    extrapolate: 'clamp',
  })

  const updateContentTopPadding = useCallback(
    (headerOffset: number, force = false) => {
      const nextContentTopPadding =
        headerOffset >= collapsibleHeight - HEADER_SYNC_HAIRLINE
          ? collapsedContentTopPadding
          : expandedContentTopPadding

      if (
        !force &&
        contentTopPaddingValueRef.current === nextContentTopPadding
      ) {
        return
      }

      contentTopPaddingValueRef.current = nextContentTopPadding
      setContentTopPaddingState(nextContentTopPadding)
    },
    [collapsedContentTopPadding, collapsibleHeight, expandedContentTopPadding]
  )

  const getRouteScrollState = useCallback((routeKey: string) => {
    const existingState = routeScrollStateMapRef.current[routeKey]
    if (existingState) return existingState

    const nextState = createRouteScrollState()
    routeScrollStateMapRef.current[routeKey] = nextState
    return nextState
  }, [])

  const setHeaderOffset = useCallback(
    (value: number, animated = false) => {
      const nextHeaderOffset = clamp(value, 0, collapsibleHeight)
      if (headerOffsetValueRef.current === nextHeaderOffset) {
        updateContentTopPadding(nextHeaderOffset)
        return
      }

      headerOffsetAnimationRef.current?.stop()
      headerOffsetAnimationRef.current = null
      headerOffsetValueRef.current = nextHeaderOffset
      updateContentTopPadding(nextHeaderOffset)

      if (!animated) {
        headerOffsetY.setValue(nextHeaderOffset)
        return
      }

      const animation = Animated.timing(headerOffsetY, {
        toValue: nextHeaderOffset,
        duration: SNAP_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })

      headerOffsetAnimationRef.current = animation
      animation.start(() => {
        if (headerOffsetAnimationRef.current === animation) {
          headerOffsetAnimationRef.current = null
        }
      })
    },
    [collapsibleHeight, headerOffsetY, updateContentTopPadding]
  )

  const updateHeaderOffsetFromScroll = useCallback(
    (scrollY: number, previousScrollY: number) => {
      const delta = scrollY - previousScrollY
      if (delta === 0) return

      // Keep the header movement continuous when an expanded header reaches
      // the top range instead of hiding it again by snapping to scrollY.
      const maxHeaderOffset = Math.min(scrollY, collapsibleHeight)
      const nextHeaderOffset = clamp(
        headerOffsetValueRef.current + delta,
        0,
        maxHeaderOffset
      )
      const shouldAnimate =
        headerOffsetAnimationRef.current !== null ||
        Math.abs(nextHeaderOffset - headerOffsetValueRef.current) >=
          HEADER_ANIMATION_DELTA_THRESHOLD

      setHeaderOffset(nextHeaderOffset, shouldAnimate)
    },
    [collapsibleHeight, setHeaderOffset]
  )

  const snapHeaderOffset = useCallback(() => {
    const currentHeaderOffset = headerOffsetValueRef.current
    if (currentHeaderOffset <= 0 || currentHeaderOffset >= collapsibleHeight) {
      return
    }

    const targetHeaderOffset =
      currentScrollYRef.current <= collapsibleHeight ||
      currentHeaderOffset < collapsibleHeight / 2
        ? 0
        : collapsibleHeight

    setHeaderOffset(targetHeaderOffset, true)
  }, [collapsibleHeight, setHeaderOffset])

  const cancelPendingHeaderSnap = useCallback(() => {
    if (pendingHeaderSnapTimeoutRef.current === null) return

    clearTimeout(pendingHeaderSnapTimeoutRef.current)
    pendingHeaderSnapTimeoutRef.current = null
  }, [])

  const scheduleHeaderSnap = useCallback(
    (routeKey: string) => {
      cancelPendingHeaderSnap()
      pendingHeaderSnapTimeoutRef.current = setTimeout(() => {
        pendingHeaderSnapTimeoutRef.current = null
        if (activeRouteKeyRef.current === routeKey) {
          snapHeaderOffset()
        }
      }, SCROLL_END_SNAP_DELAY)
    },
    [cancelPendingHeaderSnap, snapHeaderOffset]
  )

  const applyRouteScroll = useCallback(
    (
      routeKey: string,
      targetScrollY: number,
      animated = false,
      retryCount = 0
    ) => {
      const routeState = getRouteScrollState(routeKey)
      const nextScrollY = getScrollableTargetOffset(routeState, targetScrollY)

      routeState.pendingScrollY = nextScrollY
      routeState.scrollY = nextScrollY

      if (activeRouteKeyRef.current === routeKey) {
        currentScrollYRef.current = nextScrollY
        setHeaderOffset(nextScrollY)
      }

      if (!routeState.ref) return

      scrollTo(routeState.ref, nextScrollY, animated)

      if (retryCount <= 0) {
        if (routeState.contentHeight > 0 && routeState.layoutHeight > 0) {
          routeState.pendingScrollY = null
        }
        return
      }

      setTimeout(() => {
        applyRouteScroll(routeKey, targetScrollY, animated, retryCount - 1)
      }, SCROLL_SYNC_RETRY_DELAY)
    },
    [getRouteScrollState, setHeaderOffset]
  )

  const getSyncedRouteScrollY = useCallback(
    (routeKey: string) => {
      const routeScrollY = getRouteScrollState(routeKey).scrollY
      const currentHeaderOffset = headerOffsetValueRef.current
      const routeIsWithinHeader =
        routeScrollY <= collapsibleHeight + HEADER_SYNC_HAIRLINE
      const hasHeaderGap = currentHeaderOffset > routeScrollY

      // Mirrors react-native-collapsible-tab-view: only move an unfocused tab
      // when its current offset would create a gap under the header.
      if (hasHeaderGap || routeIsWithinHeader) {
        return currentHeaderOffset
      }

      return routeScrollY
    },
    [collapsibleHeight, getRouteScrollState]
  )

  const syncRouteToCurrentHeader = useCallback(
    (routeKey: string, retryCount = SCROLL_SYNC_RETRY_COUNT) => {
      const nextScrollY = getSyncedRouteScrollY(routeKey)

      applyRouteScroll(routeKey, nextScrollY, false, retryCount)
      return nextScrollY
    },
    [applyRouteScroll, getSyncedRouteScrollY]
  )

  const syncAdjacentRoutes = useCallback(() => {
    const previousRoute = navigationState.routes[navigationState.index - 1]
    const nextRoute = navigationState.routes[navigationState.index + 1]

    if (previousRoute) syncRouteToCurrentHeader(previousRoute.key, 0)
    if (nextRoute) syncRouteToCurrentHeader(nextRoute.key, 0)
  }, [navigationState.index, navigationState.routes, syncRouteToCurrentHeader])

  const syncRoute = useCallback(
    (routeKey: string, keepHidden = false) => {
      if (keepHidden) {
        syncRouteToCurrentHeader(routeKey)
        return
      }

      const routeState = getRouteScrollState(routeKey)
      currentScrollYRef.current = routeState.scrollY
      setHeaderOffset(routeState.scrollY)
    },
    [getRouteScrollState, setHeaderOffset, syncRouteToCurrentHeader]
  )

  const resetRouteScroll = useCallback(
    (routeKey: string) => {
      const routeState = getRouteScrollState(routeKey)
      routeState.pendingScrollY = 0
      routeState.scrollY = 0

      applyRouteScroll(routeKey, 0, false, SCROLL_SYNC_RETRY_COUNT)
    },
    [applyRouteScroll, getRouteScrollState]
  )

  const changeIndex = useCallback(
    (nextIndex: number, forceFetch = false) => {
      const nextRoute = navigationState.routes[nextIndex]
      if (!nextRoute) return

      if (nextIndex !== navigationState.index) {
        syncRouteToCurrentHeader(nextRoute.key)
        activeRouteKeyRef.current = nextRoute.key
      }

      onIndexChange(nextIndex, forceFetch)
    },
    [
      navigationState.index,
      navigationState.routes,
      onIndexChange,
      syncRouteToCurrentHeader,
    ]
  )

  const getListScrollProps = useCallback(
    (routeKey: string): CollapsibleTabViewListScrollProps => ({
      contentTopPadding: headerHeight,
      onContentSizeChange: (_width, height) => {
        const routeState = getRouteScrollState(routeKey)
        routeState.contentHeight = height
        routeState.maxOffset = Math.max(0, height - routeState.layoutHeight)

        if (routeState.pendingScrollY !== null) {
          applyRouteScroll(routeKey, routeState.pendingScrollY)
        }
      },
      onLayout: event => {
        const routeState = getRouteScrollState(routeKey)
        routeState.layoutHeight = event.nativeEvent.layout.height
        routeState.maxOffset = Math.max(
          0,
          routeState.contentHeight - routeState.layoutHeight
        )

        if (routeState.pendingScrollY !== null) {
          applyRouteScroll(routeKey, routeState.pendingScrollY)
        }
      },
      onMomentumScrollBegin: () => {
        cancelPendingHeaderSnap()
      },
      onMomentumScrollEnd: () => {
        cancelPendingHeaderSnap()
        getRouteScrollState(routeKey).pendingScrollY = null
        if (activeRouteKeyRef.current === routeKey) {
          snapHeaderOffset()
        }
      },
      onScroll: event => {
        const { maxOffset, scrollY } = getEventScrollY(event)
        const routeState = getRouteScrollState(routeKey)
        const previousScrollY = routeState.scrollY

        routeState.maxOffset = maxOffset
        routeState.scrollY = scrollY
        routeState.pendingScrollY = null

        if (activeRouteKeyRef.current !== routeKey) return

        currentScrollYRef.current = scrollY
        updateHeaderOffsetFromScroll(scrollY, previousScrollY)
      },
      onScrollBeginDrag: () => {
        cancelPendingHeaderSnap()
        headerOffsetAnimationRef.current?.stop()
        headerOffsetAnimationRef.current = null
        getRouteScrollState(routeKey).pendingScrollY = null
      },
      onScrollEndDrag: () => {
        getRouteScrollState(routeKey).pendingScrollY = null
        if (activeRouteKeyRef.current === routeKey) {
          scheduleHeaderSnap(routeKey)
        }
      },
      scrollEventThrottle: 16,
      setScrollRef: scrollRef => {
        const routeState = getRouteScrollState(routeKey)
        routeState.ref = scrollRef

        if (scrollRef && routeState.pendingScrollY !== null) {
          applyRouteScroll(
            routeKey,
            routeState.pendingScrollY,
            false,
            SCROLL_SYNC_RETRY_COUNT
          )
        }
      },
    }),
    [
      applyRouteScroll,
      cancelPendingHeaderSnap,
      getRouteScrollState,
      headerHeight,
      scheduleHeaderSnap,
      snapHeaderOffset,
      updateHeaderOffsetFromScroll,
    ]
  )

  const handleSwipeStart = useCallback(() => {
    syncAdjacentRoutes()
    onSwipeStart?.()
  }, [onSwipeStart, syncAdjacentRoutes])

  useImperativeHandle(
    ref,
    () => ({
      resetRouteScroll,
      syncRoute,
    }),
    [resetRouteScroll, syncRoute]
  )

  useEffect(() => {
    updateContentTopPadding(headerOffsetValueRef.current, true)
  }, [collapsibleHeight, headerHeight, updateContentTopPadding])

  useEffect(
    () => () => {
      cancelPendingHeaderSnap()
    },
    [cancelPendingHeaderSnap]
  )

  useEffect(() => {
    const activeRouteKey = navigationState.routes[navigationState.index]?.key
    if (!activeRouteKey) return

    if (activeRouteKeyRef.current !== activeRouteKey) {
      syncRouteToCurrentHeader(activeRouteKey)
      activeRouteKeyRef.current = activeRouteKey
      return
    }

    const routeState = getRouteScrollState(activeRouteKey)
    currentScrollYRef.current = routeState.scrollY
  }, [
    getRouteScrollState,
    navigationState.index,
    navigationState.routes,
    syncRouteToCurrentHeader,
  ])

  return (
    <TabView
      {...props}
      initialLayout={initialLayout ?? { width: layout.width }}
      navigationState={navigationState}
      onIndexChange={changeIndex}
      onSwipeStart={handleSwipeStart}
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
