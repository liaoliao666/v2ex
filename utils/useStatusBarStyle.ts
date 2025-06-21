import { useFocusEffect } from '@react-navigation/native'
import { StatusBar } from 'react-native'
import { AppState, Keyboard } from 'react-native'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'

let currentStatusBarStyle: 'default' | 'light-content' | 'dark-content'

function updateStatusBarStyle() {
  if (currentStatusBarStyle === 'default') {
    const nextStatusBarStyle =
      store.get(colorSchemeAtom) === 'dark'
        ? 'light-content'
        : 'dark-content'
    StatusBar.setBarStyle(nextStatusBarStyle)
  } else {
    StatusBar.setBarStyle(currentStatusBarStyle)
  }
}

export function useStatusBarStyle(
  statusBarStyle: 'default' | 'light-content' | 'dark-content'
) {
  useFocusEffect(() => {
    currentStatusBarStyle = statusBarStyle
    updateStatusBarStyle()

    const l1 = AppState.addEventListener('change', updateStatusBarStyle)
    const l2 = Keyboard.addListener('keyboardDidHide', updateStatusBarStyle)

    return () => {
      l1.remove()
      l2.remove()
    }
  })
}

// updateStatusBarStyle when window on focus
AppState.addEventListener('change', status => {
  if (status === 'active') {
    updateStatusBarStyle()
  }
})

Keyboard.addListener('keyboardDidHide', () => {
  updateStatusBarStyle()
})
