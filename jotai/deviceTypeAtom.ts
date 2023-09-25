import * as Device from 'expo-device'
import { atom, useAtomValue } from 'jotai'
import { Dimensions, useWindowDimensions } from 'react-native'

import { store } from './store'

export const deviceTypeAtom = atom(Device.getDeviceTypeAsync)

export const isTabletAtom = atom(
  get => get(deviceTypeAtom) === Device.DeviceType.TABLET
)

export const isLargeTablet = () =>
  store.get(isTabletAtom) && Dimensions.get('window').width >= 1024

export const useIsLargeTablet = () => {
  const isTablet = useAtomValue(isTabletAtom)
  const { width } = useWindowDimensions()
  return isTablet && width >= 1024
}
