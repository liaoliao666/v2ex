import { useAtomValue } from 'jotai'
import { ReactNode } from 'react'
import { View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import StyledActivityIndicator from './StyledActivityIndicator'

export default function RefetchingIndicator({
  children,
  progressViewOffset = 0,
  isRefetching,
}: {
  children: ReactNode
  progressViewOffset?: number
  isRefetching: boolean
}) {
  const { colors } = useAtomValue(uiAtom)
  return (
    <View style={tw`flex-1`}>
      {children}

      {isRefetching && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={tw.style(`absolute inset-x-0 flex-row justify-center`, {
            top: progressViewOffset + 24,
          })}
          pointerEvents="none"
        >
          <View
            style={tw`rounded-full p-2 shadow-lg dark:shadow-white bg-[${colors.base100}]`}
          >
            <StyledActivityIndicator />
          </View>
        </Animated.View>
      )}
    </View>
  )
}
