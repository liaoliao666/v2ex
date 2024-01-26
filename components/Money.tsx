import { useAtomValue } from 'jotai'
import { isEmpty } from 'lodash-es'
import { Text, View, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import StyledImage from './StyledImage'

export default function Money({
  style,
  gold,
  silver,
  bronze,
}: {
  style?: ViewStyle
  gold?: number
  silver?: number
  bronze?: number
}) {
  const moneyOptions = [
    { uri: `/static/img/gold@2x.png`, value: gold },
    { uri: `/static/img/silver@2x.png`, value: silver },
    { uri: `/static/img/bronze@2x.png`, value: bronze },
  ].filter(o => !!o.value)

  const { colors, fontSize } = useAtomValue(uiAtom)

  if (isEmpty(moneyOptions)) return null
  return (
    <View style={tw.style(`flex-row gap-1`, style)}>
      {moneyOptions.map(o => (
        <View style={tw`flex-row items-center`} key={o.uri}>
          <Text style={tw`text-[${colors.default}] ${fontSize.medium}`}>
            {o.value}
          </Text>
          <StyledImage style={tw`w-4 h-4 ml-0.5`} source={o.uri} />
        </View>
      ))}
    </View>
  )
}
