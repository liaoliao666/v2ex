import * as Device from 'expo-device'
import { atom } from 'jotai'

export const deviceTypeAtom = atom(Device.getDeviceTypeAsync)
