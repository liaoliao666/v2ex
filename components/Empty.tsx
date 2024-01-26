import { useAtomValue } from 'jotai'
import { Text, View, ViewStyle } from 'react-native'
import Svg, { Ellipse, G, Path } from 'react-native-svg'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

export default function Empty({
  description = '暂无数据',
  style,
}: {
  description?: string
  style?: ViewStyle
}) {
  const { fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw.style(`py-32 items-center`, style)}>
      <Svg width={64} height={41}>
        <G transform="translate(0 1)" fill="none" fillRule="evenodd">
          <Ellipse
            fill={tw.color(`text-[#f5f5f5] dark:text-[#272727]`)}
            cx={32}
            cy={33}
            rx={32}
            ry={7}
          />
          <G
            fillRule="nonzero"
            stroke={tw.color(`text-[#d9d9d9] dark:text-[#3e3e3e]`)}
          >
            <Path d="M55 12.76 44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
            <Path
              d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
              fill={tw.color(`text-[#fafafa] dark:text-[#1d1d1d]`)}
            />
          </G>
        </G>
      </Svg>
      <Text
        style={tw`text-[rgba(0,0,0,.25)] dark:text-[rgba(255,255,255,.25)] ${fontSize.medium} mt-2 px-4`}
      >
        {description}
      </Text>
    </View>
  )
}
