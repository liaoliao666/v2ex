import { useAtomValue } from 'jotai'
import { isEmpty } from 'lodash-es'
import { Text, View, ViewStyle } from 'react-native'

import { baseUrlAtom } from '@/jotai/baseUrlAtom'
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
    { key: `gold`, value: gold },
    { key: `silver`, value: silver },
    { key: `bronze`, value: bronze },
  ].filter(o => !!o.value)

  const { colors, fontSize } = useAtomValue(uiAtom)
  const baseURL = useAtomValue(baseUrlAtom)

  if (isEmpty(moneyOptions)) return null
  return (
    <View style={tw.style(`flex-row gap-1`, style)}>
      {moneyOptions.map(o => (
        <View style={tw`flex-row items-center`} key={o.key}>
          <Text style={tw`text-[${colors.default}] ${fontSize.medium}`}>
            {o.value}
          </Text>
          <StyledImage
            style={tw`w-4 h-4 ml-0.5`}
            source={`${baseURL}/static/img/${o.key}@2x.png`}
          />
        </View>
      ))}
    </View>
  )
}
