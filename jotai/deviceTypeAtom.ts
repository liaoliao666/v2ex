import * as Device from 'expo-device'
import { atom } from 'jotai'

export const deviceTypeAtom = atom(Device.getDeviceTypeAsync)

export const isTabletAtom = atom(
  get => get(deviceTypeAtom) === Device.DeviceType.TABLET
)
