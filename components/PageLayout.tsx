import { ReactNode } from 'react'
import { View } from 'react-native'

import HomeScreen from '@/screens/HomeScreen'
import { useIsLargeTablet, useIsTablet } from '@/utils/tablet'
import tw from '@/utils/tw'

import Profile from './Profile'

export default function PageLayout({ children }: { children: ReactNode }) {
  const isTablet = useIsTablet()
  const isLargeTablet = useIsLargeTablet()

  if (isTablet) {
    return (
      <View style={tw`flex-1 flex-row bg-body-1 justify-center`}>
        <View style={tw`items-end flex-grow-0 flex-shrink-0`}>
          <Profile onlyIcon />
        </View>

        {isLargeTablet && (
          <View
            style={tw`bg-body-1 border-solid border-l border-r border-tint-border w-[400px]`}
          >
            <HomeScreen alwaysDisplay />
          </View>
        )}

        <View
          style={tw.style(
            `flex-1 bg-body-1`,
            !isLargeTablet && `border-solid border-l border-tint-border`
          )}
        >
          {children}
        </View>
      </View>
    )
  }

  return children
}
