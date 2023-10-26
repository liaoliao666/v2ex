import { useFocusEffect } from '@react-navigation/native'
import { StatusBarStyle, setStatusBarStyle } from 'expo-status-bar'
import { AppState, Keyboard } from 'react-native'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'

let currentStatusBarStyle: StatusBarStyle

function updateStatusBarStyle() {
  const nextStatusBarStyle =
    currentStatusBarStyle === 'auto'
      ? store.get(colorSchemeAtom) === 'dark'
        ? 'light'
        : 'dark'
      : currentStatusBarStyle

  setStatusBarStyle(nextStatusBarStyle)
}

export function useStatusBarStyle(statusBarStyle: StatusBarStyle) {
  useFocusEffect(() => {
    currentStatusBarStyle = statusBarStyle
    updateStatusBarStyle()
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
