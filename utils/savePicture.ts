// Top-level module import
import * as MediaLibrary from 'expo-media-library'

export const savePicture = async (uri: string) => {
  const { status } = await MediaLibrary.requestPermissionsAsync()
  if (status !== 'granted') {
    return Promise.reject('No Premission')
  }
  await MediaLibrary.saveToLibraryAsync(uri)
}
