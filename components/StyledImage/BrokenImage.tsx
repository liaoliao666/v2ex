import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'

import { BROKEN_IMAGE_SIZE } from './helper'

export default function BrokenImage({
  onPress,
  style,
}: {
  onPress: () => void
  style: StyleProp<ViewStyle>
}) {
  const { colors } = useAtomValue(uiAtom)

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[style, hasSize(style) && tw`items-center justify-center`]}
    >
      <MaterialCommunityIcons
        name="image-off-outline"
        size={
          hasSize(style) &&
          isFinite(style.width) &&
          style.width < BROKEN_IMAGE_SIZE
            ? style.width
            : BROKEN_IMAGE_SIZE
        }
        color={colors.default}
      />
    </TouchableOpacity>
  )
}
