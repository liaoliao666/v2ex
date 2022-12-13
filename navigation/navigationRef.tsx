import {
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { RootStackParamList } from '../types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function getNavigation() {
  if (!navigationRef.isReady()) return

  const navigation = navigationRef as unknown as NativeStackNavigationProp<
    RootStackParamList,
    keyof RootStackParamList,
    undefined
  >

  navigation.push = (...args) => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch((StackActions as any).push(...args))
    }
  }

  return navigation
}
