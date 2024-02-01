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

    const isChange = async () =>
      colors.base100 !== (await NavigationBar.getBackgroundColorAsync())
    const change = () => {
      NavigationBar.setBackgroundColorAsync(colors.base100)
      NavigationBar.setBorderColorAsync(`transparent`)
      NavigationBar.setButtonStyleAsync(
        colorScheme === 'dark' ? 'light' : 'dark'
      )
    }
    change()

    const l1 = AppState.addEventListener('change', async () => {
      if (await isChange()) {
        sleep(100).then(change)
      }
    })
    const l2 = AppState.addEventListener('focus', async () => {
      if (await isChange()) {
        sleep(100).then(change)
      }
    })

    return () => {
      l1.remove()
      l2.remove()
    }
  }, [colors.base100, colorScheme, readyAndroid])
}
