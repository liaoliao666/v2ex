import * as ImageManipulator from 'expo-image-manipulator'

const compressPromises = new Map<
  string,
  Promise<ImageManipulator.ImageResult>
>()

const compressImage = async (
  uri: string
): Promise<ImageManipulator.ImageResult> => {
  try {
    const staticImage = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    })
    return staticImage
  } catch (error) {
    return { uri } as ImageManipulator.ImageResult
  }
}

export function getCompressedImage(
  uri: string
): Promise<ImageManipulator.ImageResult> {
  if (!compressPromises.has(uri)) {
    compressPromises.set(uri, compressImage(uri))
  }

  return compressPromises.get(uri)!
}
