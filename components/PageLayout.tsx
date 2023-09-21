import { ReactNode } from 'react'
import { View, useWindowDimensions } from 'react-native'

import { useIsTablet } from '@/jotai/deviceTypeAtom'
import tw from '@/utils/tw'

import Profile from './Profile'

export default function PageLayout({ children }: { children: ReactNode }) {
  const isTablet = useIsTablet()
  const { width } = useWindowDimensions()

  if (isTablet) {
    return (
      <View style={tw`flex-1 flex-row bg-body-1 justify-center`}>
        <View style={tw`items-end flex-grow-0 flex-shrink-0`}>
          <Profile onlyIcon={width <= 1024} />
        </View>

        <View
          style={tw`bg-body-1 border-solid border-l border-r border-tint-border flex-1 max-w-[600px]`}
        >
          {children}
        </View>
      </View>
    )
  }

  return children
}
