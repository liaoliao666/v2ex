import { useAtomValue } from 'jotai'
import { ReactElement, ReactNode } from 'react'
import { View } from 'react-native'

import { isTabletAtom } from '@/jotai/deviceTypeAtom'
import tw from '@/utils/tw'

import Profile from './Profile'

export default function PageLayout({
  children,
  hideSideBar,
}: {
  children: ReactNode
  hideSideBar?: boolean
}) {
  const isTablet = useAtomValue(isTabletAtom)

  if (!isTablet) return children as ReactElement

  return (
    <View style={tw`flex-1 bg-body-1 items-center`}>
      <View style={tw`flex-row flex-1`}>
        {!hideSideBar && (
          <View style={tw`w-[280px] border-l border-solid border-tint-border`}>
            <Profile />
          </View>
        )}

        <View
          style={tw`max-w-[600px] flex-1 bg-body-1 border-solid border-l border-r border-tint-border`}
        >
          {children}
        </View>
      </View>
    </View>
  )
}
