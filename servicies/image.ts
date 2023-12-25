import axios from 'axios'
import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'react-query-kit'
import SparkMD5 from 'spark-md5'

import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { store } from '@/jotai/store'

export const imageService = router(`image`, {
  upload: router.mutation({
    mutationFn: async () => {
      const clientId = store.get(imgurConfigAtom)?.clientId

      if (!clientId) return Promise.reject(new Error('请先配置你的Imgur'))

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      })

      if (result.canceled) return Promise.reject(new Error('已取消选择图片'))

      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: 'base64',
      })
      const md5 = SparkMD5.hashBinary(base64)
      const cache = store.get(imgurConfigAtom)?.uploadedFiles[md5]

      if (cache) return cache

      const formData = new FormData()
      formData.append('type', 'base64')
      formData.append('image', base64)

      const {
        data: { data },
      } = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
          Authorization: `Client-ID ${clientId}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!data.link) {
        return Promise.reject(new Error('上传图片失败'))
      }

      store.set(imgurConfigAtom, prev => ({
        ...prev,
        uploadedFiles: {
          ...prev.uploadedFiles,
          [md5]: data.link,
        },
      }))

      return data.link as string
    },
  }),
})
