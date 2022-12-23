import { useFocusEffect } from '@react-navigation/native'
import { StatusBarStyle, setStatusBarStyle } from 'expo-status-bar'
import { useAtomValue } from 'jotai'

import { colorSchemeAtom } from '@/jotai/themeAtom'

export function useStatusBarStyle(statusBarStyle: StatusBarStyle) {
  const colorScheme = useAtomValue(colorSchemeAtom)

  useFocusEffect(() => {
    const nextStatusBarStyle =
      statusBarStyle === 'auto'
        ? colorScheme === 'dark'
          ? 'light'
          : 'dark'
        : statusBarStyle

    setStatusBarStyle(nextStatusBarStyle)
  })
}
