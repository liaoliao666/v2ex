import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import { uiAtom } from '@/jotai/uiAtom'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SelectableTextScreen() {
  const {
    params: { html },
  } = useRoute<RouteProp<RootStackParamList, 'SelectableText'>>()

  const { colors } = useAtomValue(uiAtom)

  return (
    <View style={tw`bg-[${colors.base100}] flex-1`}>
      <NavBar
        title="选择文本"
        hideSafeTop
        style={tw`border-[${colors.divider}] border-b border-solid`}
      />

      <ScrollView style={tw`px-4 flex-1`}>
        <View style={tw`h-4`} />
        <Html source={{ html }} selectOnly />
        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </View>
  )
}
