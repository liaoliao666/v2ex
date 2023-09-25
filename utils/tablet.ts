import * as Device from 'expo-device'
import { useAtomValue } from 'jotai'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'

import { deviceTypeAtom } from '../jotai/deviceTypeAtom'
import { store } from '../jotai/store'

export const isTablet = () =>
  Platform.OS === 'ios'
    ? store.get(deviceTypeAtom) === Device.DeviceType.TABLET
    : Dimensions.get('window').width >= 768

export const isLargeTablet = () =>
  isTablet() && Dimensions.get('window').width >= 900

export const useIsTablet = () => {
  useAtomValue(deviceTypeAtom)
  useWindowDimensions()
  return isTablet()
}

export const useIsLargeTablet = () => {
  useAtomValue(deviceTypeAtom)
  useWindowDimensions()
  return isLargeTablet()
}
