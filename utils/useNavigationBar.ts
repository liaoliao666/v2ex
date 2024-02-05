import * as NavigationBar from 'expo-navigation-bar'
import { useAtomValue } from 'jotai'
import { useLayoutEffect } from 'react'
import { AppState } from 'react-native'

import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'

import { sleep } from './sleep'

// https://github.com/liaoliao666/v2ex/issues/92
export function useNavigationBar(readyAndroid: boolean) {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors } = useAtomValue(uiAtom)

  useLayoutEffect(() => {
    if (!readyAndroid) return

    const change = () => {
      NavigationBar.setBackgroundColorAsync(colors.base100)
      NavigationBar.setBorderColorAsync(`transparent`)
      NavigationBar.setButtonStyleAsync(
        colorScheme === 'dark' ? 'light' : 'dark'
      )
    }
    change()

    const handleChange = async () => {
      const changed =
        colors.base100 !== (await NavigationBar.getBackgroundColorAsync())
      if (changed) {
        sleep(100).then(change)
      }
    }

    const l1 = AppState.addEventListener('change', handleChange)
    const l2 = AppState.addEventListener('focus', handleChange)

    return () => {
      l1.remove()
      l2.remove()
    }
  }, [colors.base100, colorScheme, readyAndroid])
}
