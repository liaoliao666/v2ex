import { compact } from 'lodash-es'
import { memo } from 'react'
import { Pressable, Text } from 'react-native'

import { Node } from '@/servicies/types'
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
  return (
    <Pressable
      style={({ pressed }) =>
        tw.style(
          `h-[${NAV_BAR_HEIGHT}px] px-4 flex-row items-center`,
          pressed && `bg-message-press`
        )
      }
      onPress={() => {
        onPressNodeItem(node)
      }}
    >
      <StyledImage
        style={tw`w-5 h-5`}
        source={{
          uri: node.avatar_large,
        }}
      />
      <Text style={tw`text-body-5 text-tint-secondary ml-2`}>
        {compact([node.title, node.name]).join(' / ')}
      </Text>
    </Pressable>
  )
}
