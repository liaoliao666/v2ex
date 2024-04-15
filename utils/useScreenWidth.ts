import { useWindowDimensions } from 'react-native'

import { useTablet } from './tablet'

/**
 * 屏幕宽度
 * 适配 iPad 布局
 */
export function useScreenWidth() {
  const { width } = useWindowDimensions()
  const { isTablet, navbarWidth } = useTablet()
  return isTablet ? width - navbarWidth : width
}
