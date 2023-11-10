import { StatusBarStyle } from 'expo-status-bar'
import { ReactNode, isValidElement } from 'react'
import { Platform, PressableProps, Text, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { useStatusBarStyle } from '@/utils/useStatusBarStyle'

import IconButton from './IconButton'

export const NAV_BAR_HEIGHT = 53

export default function NavBar({
  children,
  style,
  title,
  tintColor = tw.color(`text-foreground`),
  statusBarStyle = 'auto',
  left = <BackButton tintColor={tintColor} />,
  right,
  hideSafeTop,
}: {
  children?: ReactNode
  style?: ViewStyle
  title?: ReactNode
  tintColor?: string
  statusBarStyle?: StatusBarStyle
  left?: ReactNode
  right?: ReactNode
  hideSafeTop?: boolean
}) {
  useStatusBarStyle(statusBarStyle)

  const safeTop = useNavBarSafeTop(hideSafeTop)

  return (
    <View
      style={tw.style(
        `pt-[${safeTop}px`,
        Platform.OS === 'android' && `border-divider border-solid border-b`,
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
          {isValidElement(children) ? (
            children
          ) : (
            <Text
              style={tw.style(
                `text-foreground ${getFontSize(4)} font-semibold`,
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
  const color = tintColor || tw.color(`text-foreground`)

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
          navigation.replace('Root')
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
