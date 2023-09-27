import { useAtomValue } from 'jotai'
import { View } from 'react-native'

import Empty from '@/components/Empty'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

export default function NotFoundScreen() {
  const colorScheme = useAtomValue(colorSchemeAtom)
  return (
    <View key={colorScheme} style={tw`flex-1 justify-center items-center`}>
      <Empty />
    </View>
  )
}
