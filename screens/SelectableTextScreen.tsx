import { RouteProp, useRoute } from '@react-navigation/native'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SelectableTextScreen() {
  const {
    params: { html, htmlLayout },
  } = useRoute<RouteProp<RootStackParamList, 'SelectableText'>>()

  return (
    <View style={tw`bg-background flex-1`}>
      <NavBar
        title="选择文本"
        hideSafeTop
        style={tw`border-divider border-b border-solid`}
      />

      <ScrollView style={tw`px-4`}>
        <View style={tw`pt-4`}>
          <View style={{ minHeight: htmlLayout?.height }}>
            <Html source={{ html }} selectOnly />
          </View>
        </View>
        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </View>
  )
}
