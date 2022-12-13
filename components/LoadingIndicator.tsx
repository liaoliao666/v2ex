import * as React from 'react'
import { View, ViewStyle } from 'react-native'

import tw from '@/utils/tw'

import StyledActivityIndicator from './StyledActivityIndicator'

export default function LoadingIndicator({ style }: { style?: ViewStyle }) {
  return (
    <View style={tw.style(`flex-1 justify-center items-center`, style)}>
      <StyledActivityIndicator size="large" />
    </View>
  )
}
