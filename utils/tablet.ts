import DeviceInfo from 'react-native-device-info'
import { useAtomValue } from 'jotai'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'

import { deviceTypeAtom } from '../jotai/deviceTypeAtom'
import { store } from '../jotai/store'

export const isTablet = () => {
  // 直接用 DeviceInfo.isTablet() 判断
  return DeviceInfo.isTablet()
}

export const useTablet = () => {
  useAtomValue(deviceTypeAtom)
  const { width } = useWindowDimensions()
  return {
    navbarWidth: isTablet() ? Math.min(Math.floor((3 / 7) * width), 460) : 0,
    isTablet: isTablet(),
  }
}
