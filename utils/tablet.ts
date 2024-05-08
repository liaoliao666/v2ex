import * as Device from 'expo-device'
import { useAtomValue } from 'jotai'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'

import { deviceTypeAtom } from '../jotai/deviceTypeAtom'
import { store } from '../jotai/store'

export const isTablet = () => {
  const deviceType = store.get(deviceTypeAtom)
  const tablet =
    deviceType === Device.DeviceType.TABLET ||
    deviceType === Device.DeviceType.DESKTOP

  return Platform.OS === 'ios'
    ? tablet
    : tablet || Dimensions.get('window').width >= 700
}

export const useTablet = () => {
  useAtomValue(deviceTypeAtom)
  const { width } = useWindowDimensions()
  return {
    navbarWidth: isTablet() ? Math.min(Math.floor((3 / 7) * width), 460) : 0,
    isTablet: isTablet(),
  }
}
