import * as NavigationBar from 'expo-navigation-bar'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { AppState } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'

// https://github.com/liaoliao666/v2ex/issues/92
export function useNavigationBar(readyAndroid: boolean) {
  const colorScheme = useAtomValue(colorSchemeAtom)

  useEffect(() => {
    if (!readyAndroid) return

    const change = () => {
      NavigationBar.setStyle(colorScheme === 'dark' ? 'light' : 'dark')
    }
    change()

    const l1 = AppState.addEventListener('change', change)
    const l2 = AppState.addEventListener('focus', change)

    return () => {
      l1.remove()
      l2.remove()
    }
  }, [colorScheme, readyAndroid])
}
