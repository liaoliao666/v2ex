import { RouteProp, useRoute } from '@react-navigation/native'
import { createContext, useContext } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import {
  CustomTextualRenderer,
  getNativePropsForTNode,
} from 'react-native-render-html'
import { SafeAreaView } from 'react-native-safe-area-context'

import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

const IsNestedTextContext = createContext(false)

const TextRenderer: CustomTextualRenderer = props => {
  const renderProps = getNativePropsForTNode(props)

  const isNestedText = useContext(IsNestedTextContext)

  if (isNestedText) return <Text {...renderProps} />

  return (
    <IsNestedTextContext.Provider value={true}>
      <TextInput editable={false} multiline>
        <Text {...renderProps} />
      </TextInput>
    </IsNestedTextContext.Provider>
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
        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </View>
  )
}
