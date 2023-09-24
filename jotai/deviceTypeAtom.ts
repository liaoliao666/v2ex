import * as Device from 'expo-device'
import { atom, useAtomValue } from 'jotai'
import { useWindowDimensions } from 'react-native'

export const deviceTypeAtom = atom(Device.getDeviceTypeAsync)

export const useIsTablet = () => {
  const deviceType = useAtomValue(deviceTypeAtom)
  const { width } = useWindowDimensions()
  return deviceType === Device.DeviceType.TABLET || width >= 768
}
