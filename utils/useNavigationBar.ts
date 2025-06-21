import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { useAtomValue } from 'jotai'
import { useLayoutEffect } from 'react'
import { AppState, Platform } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'

import { sleep } from './sleep'

// https://github.com/liaoliao666/v2ex/issues/92
export function useNavigationBar(readyAndroid: boolean) {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors } = useAtomValue(uiAtom)

  useLayoutEffect(() => {
    if (!readyAndroid || Platform.OS !== 'android') return

    const change = () => {
      // https://github.com/facebook/react-native/issues/38152#issuecomment-1649452526
      changeNavigationBarColor(
        colors.base100,
        colorScheme === 'dark',
        false
      )
    }
    change()

    const handleChange = async () => {
      sleep(100).then(change)
    }

    const l1 = AppState.addEventListener('change', handleChange)
    const l2 = AppState.addEventListener('focus', handleChange)

    return () => {
      l1.remove()
      l2.remove()
    }
  }, [colors.base100, colorScheme, readyAndroid])
}
