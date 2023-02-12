// Top-level module import
import dayjs from 'dayjs'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'

export const savePicture = async (uri: string) => {
  const date = dayjs().format('YYYYMMDDhhmmss')
  const fileUri = FileSystem.documentDirectory + `${date}.jpg`
  try {
    const res = await FileSystem.downloadAsync(uri, fileUri)

    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') {
      return Promise.reject(new Error('请授予保存图片权限'))
    }

    try {
      const asset = await MediaLibrary.createAssetAsync(res.uri)
      const album = await MediaLibrary.getAlbumAsync('Download')
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Download', asset, false)
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
      }

      return fileUri
    } catch (error) {
      return Promise.reject(new Error('保存图片失败'))
    }
  } catch (err) {
    return Promise.reject(new Error('保存图片失败'))
  }
}
