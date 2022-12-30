import { Alert } from 'react-native'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'

export function confirm(title: string, message?: string) {
  return new Promise((resolve, reject) =>
    Alert.alert(
      title,
      message,
      [
        {
          text: '取消',
          onPress: reject,
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: resolve,
        },
      ],
      {
        userInterfaceStyle: store.get(colorSchemeAtom),
      }
    )
  )
}
