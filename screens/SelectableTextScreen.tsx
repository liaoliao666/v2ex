import { RouteProp, useRoute } from '@react-navigation/native'
import { ScrollView, TextInput, View } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'

import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

const TextRenderer: CustomTextualRenderer = props => {
  return (
    <TextInput {...getNativePropsForTNode(props)} multiline editable={false} />
  )
}

export default function SelectableTextScreen() {
  const {
    params: { html },
  } = useRoute<RouteProp<RootStackParamList, 'SelectableText'>>()

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <NavBar title="选择文本" hideSafeTop />

      <ScrollView style={tw`px-4`}>
        <Html
          source={{ html }}
          renderers={{
            _TEXT_: TextRenderer,
          }}
        />
      </ScrollView>
    </View>
  )
}
