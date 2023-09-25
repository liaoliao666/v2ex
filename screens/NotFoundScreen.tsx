import { View } from 'react-native'

import Empty from '@/components/Empty'
import tw from '@/utils/tw'

export default function NotFoundScreen() {
  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Empty />
    </View>
  )
}
