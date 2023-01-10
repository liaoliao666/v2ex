import * as React from 'react'
import { ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import tw from '@/utils/tw'

import StyledActivityIndicator from './StyledActivityIndicator'

export default function LoadingIndicator({ style }: { style?: ViewStyle }) {
  return (
    <SafeAreaView
      edges={['bottom']}
      style={tw.style(`flex-1 justify-center items-center`, style)}
    >
      <StyledActivityIndicator size="large" />
    </SafeAreaView>
  )
}
