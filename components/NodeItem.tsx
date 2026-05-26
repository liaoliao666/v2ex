import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { compact } from 'lodash-es'
import { memo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { Node } from '@/servicies'
import tw from '@/utils/tw'

import { NAV_BAR_HEIGHT } from './NavBar'
import StyledImage from './StyledImage'

export default memo(NodeItem)

function NodeItem({
  node,
  onPress,
  selected,
}: {
  node: Node
  onPress?: () => void
  selected?: boolean
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <TouchableOpacity
      style={tw`h-[${NAV_BAR_HEIGHT}px] px-4 flex-row items-center`}
      onPress={onPress}
    >
      <StyledImage style={tw`w-5 h-5`} source={node.avatar_large} />
      <Text
        style={tw`${fontSize.medium} text-[${colors.foreground}] ml-2 flex-1`}
        numberOfLines={1}
      >
        {compact([node.title, node.name]).join(' / ')}
      </Text>
      {selected && (
        <View style={tw`ml-3`}>
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={colors.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  )
}
