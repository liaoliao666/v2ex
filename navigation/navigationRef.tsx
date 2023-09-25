import {
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { noop } from 'lodash-es'

import { RootStackParamList } from '../types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export const navigation = new Proxy(
  {},
  {
    get: (_, key) => {
      if (!navigationRef.isReady()) return noop

      try {
        if (key in navigationRef) {
          return (navigationRef as any)[key]
        }

        return (...args: any[]) => {
          navigationRef.dispatch((StackActions as any)[key](...args))
        }
      } catch (error) {
        throw new Error(`Invalid navigation key: ${key as string}`)
      }
    },
  }
) as unknown as NativeStackNavigationProp<
  RootStackParamList,
  keyof RootStackParamList,
  undefined
>

export function getCurrentRouteName(): keyof RootStackParamList {
  // @ts-ignore
  return navigation.getCurrentRoute?.()?.name
}
