import { useNavigation } from '@react-navigation/native'
import { StatusBarStyle } from 'expo-status-bar'
import { ReactNode, isValidElement } from 'react'
import { Platform, Text, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import tw from '@/utils/tw'
import { useStatusBarStyle } from '@/utils/useStatusBarStyle'

import IconButton from './IconButton'

export const NAV_BAR_HEIGHT = 53

export default function NavBar({
  children,
  style,
  title,
  tintColor = tw`text-tint-primary`.color as string,
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

  const safeAreaInsets = useSafeAreaInsets()

  return (
    <View
      style={tw.style(
        `border-b border-solid border-tint-border`,
        (!hideSafeTop || Platform.OS === 'android') &&
          `pt-[${safeAreaInsets.top}px`,
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
              style={tw.style(`text-tint-primary text-[17px] font-bold`, {
                color: tintColor,
              })}
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

export function BackButton({ tintColor }: { tintColor?: string }) {
  const { goBack } = useNavigation()

  const color = tintColor || (tw`text-tint-primary`.color as string)

  return (
    <IconButton
      onPress={goBack}
      name="arrow-left"
      size={24}
      color={color}
      activeColor={color}
    />
  )
}

export function useNavBarHeight(height: number = NAV_BAR_HEIGHT) {
  const safeAreaInsets = useSafeAreaInsets()
  return safeAreaInsets.top + height
}
