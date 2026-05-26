import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { Text, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import DebouncedPressable from './DebouncedPressable'

export default function RemovableChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View
      style={tw`max-w-full rounded-full bg-[${colors.base200}] flex-row items-center py-1.5 pl-3 pr-1.5`}
    >
      <Text
        style={tw`text-[${colors.foreground}] ${fontSize.medium} flex-shrink`}
        numberOfLines={1}
      >
        {label}
      </Text>

      <DebouncedPressable
        style={tw`ml-1 w-6 h-6 rounded-full items-center justify-center`}
        onPress={onRemove}
      >
        <MaterialCommunityIcons name="close" size={16} color={colors.default} />
      </DebouncedPressable>
    </View>
  )
}
