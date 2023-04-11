import AsyncStorage from '@react-native-async-storage/async-storage'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'

const storage = createJSONStorage<any>(() => AsyncStorage)

export function atomWithAsyncStorage<T>(key: string, initialValue: T) {
  return atomWithStorage<T>(key, initialValue, storage)
}
