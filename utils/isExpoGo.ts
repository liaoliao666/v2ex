import Constants, { ExecutionEnvironment } from 'expo-constants'

// `true` when running in Expo Go.
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
