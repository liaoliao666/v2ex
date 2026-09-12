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
  ...props
}: UriProps & { containerWidth?: number }) {
  const { colors } = useAtomValue(uiAtom)
  const normalizedStyle = Array.isArray(style)
    ? StyleSheet.flatten(style)
    : style
  const hasPassedSize = hasSize(normalizedStyle)

  const svgQuery = k.other.svgXml.useQuery({
    variables: uri!,
  })

  if (svgQuery.isPending) {
    return (
      <View
        style={tw.style(
          !hasPassedSize &&
            computeOptimalDispalySize(
              containerWidth,
              svgQuery.errorUpdateCount ? 'refetching' : undefined
            ),
          `bg-[${colors.neutral}]`,
          normalizedStyle as any
        )}
      />
    )
  }

  if (!svgQuery.data) {
    return <BrokenImage style={normalizedStyle} onPress={svgQuery.refetch} />
  }

  return (
    <SvgXml
      {...props}
      xml={svgQuery.data.xml}
      style={tw.style(
        !hasPassedSize &&
          computeOptimalDispalySize(containerWidth, svgQuery.data as any),
        normalizedStyle as any
      )}
      width="100%"
    />
  )
}
