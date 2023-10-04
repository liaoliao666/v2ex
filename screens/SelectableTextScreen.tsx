import { RouteProp, useRoute } from '@react-navigation/native'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SelectableTextScreen() {
  const {
    params: { html },
  } = useRoute<RouteProp<RootStackParamList, 'SelectableText'>>()

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <NavBar title="选择文本" hideSafeTop />

      <ScrollView style={tw`px-4`}>
        <Html source={{ html }} selectOnly />
        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </View>
  )
}
