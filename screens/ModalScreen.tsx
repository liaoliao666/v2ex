import { StatusBar } from 'expo-status-bar'
import { Platform, Text, View } from 'react-native'
import tailwind from 'twrnc'

import EditScreenInfo from '@/components/EditScreenInfo'

export default function ModalScreen() {
  return (
    <View style={tailwind`flex-1 items-center justify-center`}>
      <Text style={tailwind`text-xl font-bold`}>Modal</Text>
      <View
        style={tailwind`my-[30px] h-px w-4/5 text-[rgb(15, 20, 25)] bg-[#eee] dark:bg-[rgba(255,255,255,0.1)]`}
      />
      <EditScreenInfo path="/screens/ModalScreen.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  )
}
