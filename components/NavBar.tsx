import { StatusBarStyle } from 'react-native'
import { useAtomValue } from 'jotai'
import { isArray } from 'lodash-es'
import { ReactNode, isValidElement } from 'react'
import { Platform, PressableProps, Text, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getUI, uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { useStatusBarStyle } from '@/utils/useStatusBarStyle'

import IconButton from './IconButton'
import { supportsBlurviewColors } from './StyledBlurView'

export const NAV_BAR_HEIGHT = 53

export default function NavBar({
  children,
  style,
  title,
  tintColor = getUI().colors.foreground,
  statusBarStyle = 'default',
  left = <BackButton tintColor={tintColor} />,
  right,
  hideSafeTop,
  disableStatusBarStyle = false,
}: {
  children?: ReactNode
  style?: ViewStyle
  title?: ReactNode
  tintColor?: string
  statusBarStyle?: StatusBarStyle
  left?: ReactNode
  right?: ReactNode
  hideSafeTop?: boolean
  disableStatusBarStyle?: boolean
}) {
  if (!disableStatusBarStyle) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useStatusBarStyle(statusBarStyle)
  }

  const safeTop = useNavBarSafeTop(hideSafeTop)
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View
      style={tw.style(
        `pt-[${safeTop}px`,
        (Platform.OS === 'android' ||
          !supportsBlurviewColors.includes(colors.base100)) &&
          `border-[${colors.divider}] border-solid border-b`,
        style
      )}
    >
      <View style={tw`px-4 flex-row items-center h-[${NAV_BAR_HEIGHT}px]`}>
        {!!left && (
          <View style={tw`min-w-[56px] flex-row justify-start items-center`}>
            {left}
          </View>
        )}

        <View style={tw`flex-1 flex-row items-center`}>
          {isArray(children) || isValidElement(children) ? (
            children
          ) : (
            <Text
              style={tw.style(
                fontSize.large,
                `text-[${colors.foreground}] font-semibold`,
                {
                  color: tintColor,
                }
              )}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
        </View>

        {right && (
          <View style={tw`min-w-[56px] flex-row justify-end items-center`}>
            {right}
          </View>
        )}
      </View>
    </View>
  )
}

export function BackButton({
  tintColor,
  onPress,
}: {
  tintColor?: string
  onPress?: PressableProps['onPress']
}) {
  const { colors } = useAtomValue(uiAtom)
  const color = tintColor || colors.foreground

  return (
    <IconButton
      onPress={ev => {
        if (typeof onPress === 'function') {
          onPress(ev)
          return
        }

        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.replace('Home')
        }
      }}
      name="arrow-left"
      size={24}
      color={color}
      activeColor={color}
    />
  )
}

export function useNavBarHeight(hideSafeTop?: boolean) {
  return useNavBarSafeTop(hideSafeTop) + NAV_BAR_HEIGHT
}

function useNavBarSafeTop(hideSafeTop?: boolean) {
  const safeAreaInsets = useSafeAreaInsets()
  return !hideSafeTop || Platform.OS === 'android' ? safeAreaInsets.top : 0
}
