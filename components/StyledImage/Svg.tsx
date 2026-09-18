import { useAtomValue } from 'jotai'
import { StyleSheet, View } from 'react-native'
import { SvgXml, UriProps } from 'react-native-svg'

import { uiAtom } from '@/jotai/uiAtom'
import { k } from '@/servicies'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'

import BrokenImage from './BrokenImage'
import { computeOptimalDispalySize } from './helper'

export default function Svg({
  uri,
  style,
  containerWidth,
  placeholderSize,
  ...props
}: UriProps & { containerWidth?: number; placeholderSize?: number }) {
  const { colors } = useAtomValue(uiAtom)
  const normalizedStyle = Array.isArray(style)
    ? StyleSheet.flatten(style)
    : style
  const hasPassedSize = hasSize(normalizedStyle)

  const svgQuery = k.other.svgXml.useQuery({
    variables: uri!,
  })
  const svgSize = svgQuery.data
    ? (svgQuery.data as any)
    : svgQuery.isPending
    ? svgQuery.errorUpdateCount
      ? 'refetching'
      : undefined
    : 'error'
  const displaySize = !hasPassedSize
    ? computeOptimalDispalySize(containerWidth, svgSize, placeholderSize)
    : undefined
  const svgStyle = tw.style(displaySize, normalizedStyle as any)

  if (svgQuery.isPending) {
    return <View style={tw.style(`bg-[${colors.neutral}]`, svgStyle)} />
  }

  if (!svgQuery.data) {
    return <BrokenImage style={svgStyle} onPress={svgQuery.refetch} />
  }

  return (
    <SvgXml {...props} xml={svgQuery.data.xml} style={svgStyle} width="100%" />
  )
}
