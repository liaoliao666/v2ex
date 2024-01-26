import { useAtomValue } from 'jotai'
import { compact } from 'lodash-es'
import { memo } from 'react'
import { Text, TouchableOpacity } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { Node } from '@/servicies'
import tw from '@/utils/tw'

import { NAV_BAR_HEIGHT } from './NavBar'
import StyledImage from './StyledImage'

export default memo(NodeItem)

function NodeItem({
  node,
  onPressNodeItem,
}: {
  node: Node
  onPressNodeItem: (node: Node) => void
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <TouchableOpacity
      style={tw`h-[${NAV_BAR_HEIGHT}px] px-4 flex-row items-center`}
      onPress={() => {
        onPressNodeItem(node)
      }}
    >
      <StyledImage style={tw`w-5 h-5`} source={node.avatar_large} />
      <Text style={tw`${fontSize.medium} text-[${colors.foreground}] ml-2`}>
        {compact([node.title, node.name]).join(' / ')}
      </Text>
    </TouchableOpacity>
  )
}

NodeItem.height = NAV_BAR_HEIGHT
