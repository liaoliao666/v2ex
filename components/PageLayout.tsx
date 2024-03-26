import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import { Platform, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import HomeScreen from '@/screens/HomeScreen'
import { useIsLargeTablet, useIsTablet } from '@/utils/tablet'
import tw from '@/utils/tw'

import Profile from './Profile'

export default function PageLayout({ children }: { children: ReactNode }) {
  const isTablet = useIsTablet()
  const isLargeTablet = useIsLargeTablet()
  const { colors } = useAtomValue(uiAtom)

  if (isTablet) {
    return (
      <View style={tw`flex-1 flex-row bg-[${colors.base100}] justify-center`}>
        <View style={tw`items-end flex-grow-0 flex-shrink-0`}>
          <Profile onlyIcon />
        </View>

        {(isLargeTablet || Platform.OS === 'android') && (
          <View
            style={tw.style(
              // https://github.com/liaoliao666/v2ex/issues/69
              !isLargeTablet && 'hidden',
              `bg-[${colors.base100}] border-solid border-l border-r border-[${colors.divider}] w-[400px]`
            )}
          >
            <HomeScreen />
          </View>
        )}

        <View
          style={tw.style(
            `flex-1 bg-[${colors.base100}]`,
            !isLargeTablet && `border-solid border-l border-[${colors.divider}]`
          )}
        >
          {children}
        </View>
      </View>
    )
  }

  return children
}
