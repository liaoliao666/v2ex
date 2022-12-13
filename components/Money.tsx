import { some } from 'lodash-es'
import { Text, View, ViewProps } from 'react-native'

import tw from '@/utils/tw'

import Space from './Space'
import StyledImage from './StyledImage'

export default function Money({
  style,
  gold,
  silver,
  bronze,
}: {
  style?: ViewProps
  gold?: number
  silver?: number
  bronze?: number
}) {
  return some([gold, silver, bronze], Boolean) ? (
    <Space style={tw.style(`items-center`, style)} gap={4}>
      {!!gold && (
        <View style={tw`flex-row`}>
          <Text style={tw`text-tint-secondary text-body-6`}>{gold}</Text>
          <StyledImage
            style={tw`w-4 h-4 ml-0.5`}
            source={{ uri: `/static/img/gold@2x.png` }}
          />
        </View>
      )}
      {!!silver && (
        <View style={tw`flex-row`}>
          <Text style={tw`text-tint-secondary text-body-6`}>{silver}</Text>
          <StyledImage
            style={tw`w-4 h-4 ml-0.5`}
            source={{ uri: `/static/img/silver@2x.png` }}
          />
        </View>
      )}
      {!!bronze && (
        <View style={tw`flex-row`}>
          <Text style={tw`text-tint-secondary text-body-6`}>{bronze}</Text>
          <StyledImage
            style={tw`w-4 h-4 ml-0.5`}
            source={{ uri: `/static/img/bronze@2x.png` }}
          />
        </View>
      )}
    </Space>
  ) : null
}
