import { useAtomValue } from 'jotai'
import { View, ViewStyle } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'
import { memo } from 'react'

import { uiAtom } from '@/jotai/uiAtom'
import { k } from '@/servicies'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'

import BrokenImage from './BrokenImage'
import { computeOptimalDispalySize } from './helper'
import SvgUri from 'react-native-svg-uri'

export type SvgProps = {
  uri: string
  style?: ViewStyle
  width?: number
  height?: number
}

export default memo(function Svg({ uri, style, width, height }: SvgProps) {
  const { colors } = useAtomValue(uiAtom)
  const hasPassedSize = hasSize(style)

  const svgQuery = k.other.svgXml.useQuery({
    variables: uri!,
  })

  if (svgQuery.isPending) {
    return (
      <View
        style={tw.style(
          !hasPassedSize &&
            computeOptimalDispalySize(
              width,
              svgQuery.errorUpdateCount ? 'refetching' : undefined
            ),
          `bg-[${colors.neutral}]`,
          style as any
        )}
      />
    )
  }

  if (!svgQuery.data) {
    return <BrokenImage style={style} onPress={svgQuery.refetch} />
  }

  return (
    <View style={style}>
      <SvgUri
        width={width}
        height={height}
        source={{ uri }}
      />
    </View>
  )
})
