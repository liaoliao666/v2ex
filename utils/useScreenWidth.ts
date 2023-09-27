import { useWindowDimensions } from 'react-native'

import { useIsLargeTablet, useIsTablet } from './tablet'

/**
 * 屏幕宽度
 * 适配 iPad 布局
 */
export function useScreenWidth() {
  const { width } = useWindowDimensions()
  const isTablet = useIsTablet()
  const isLargeTablet = useIsLargeTablet()
  return isTablet ? width - 74 - (isLargeTablet ? 400 : 0) : width
}
