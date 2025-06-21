import DeviceInfo from 'react-native-device-info'
import { atom } from 'jotai'

export const deviceTypeAtom = atom(async () => {
  const isTablet = await DeviceInfo.isTablet()
  return isTablet ? 'tablet' : 'phone'
})
