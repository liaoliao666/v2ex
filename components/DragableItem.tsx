import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { Pressable, Text, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

export default function DragableItem({
  children,
  itemWidth,
  itemHeight,
  iconName,
  onIconPress,
}: {
  children: string
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  onIconPress?: () => void
  itemWidth: number
  itemHeight: number
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View
      style={tw`w-[${itemWidth}px] h-[${itemHeight}px] px-1 flex-row justify-center items-center`}
    >
      <View
        style={tw.style(
          `w-[${
            itemWidth - 8
          }px] h-[${itemHeight}px] items-center rounded-lg justify-center bg-[${
            colors.base200
          }]`
        )}
      >
        <Text
          style={tw`text-[${colors.foreground}] ${fontSize.medium}`}
          numberOfLines={1}
          ellipsizeMode={children.length > 4 ? 'middle' : undefined}
        >
          {children}
        </Text>

        {!!iconName && (
          <Pressable
            style={tw.style(`absolute w-4 h-4`, {
              top: -4,
              right: -4,
            })}
            onPress={onIconPress}
          >
            <MaterialCommunityIcons
              name={iconName}
              color={colors.default}
              size={16}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}
