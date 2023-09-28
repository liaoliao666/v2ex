import * as ImageManipulator from 'expo-image-manipulator'
import { pick } from 'lodash-es'

type CompressedImage = {
  uri: string
  size?: {
    width: number
    height: number
  }
}

const compressPromises = new Map<string, Promise<CompressedImage>>()

const compressImage = async (uri: string): Promise<CompressedImage> => {
  try {
    const staticImage = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return {
      uri: staticImage.uri,
      size: pick(staticImage, ['width', 'height']),
    }
  } catch (error) {
    return { uri }
  }
}

export function getCompressedImage(uri: string): Promise<CompressedImage> {
  if (!compressPromises.has(uri)) {
    compressPromises.set(uri, compressImage(uri))
  }

  return compressPromises.get(uri)!
}
