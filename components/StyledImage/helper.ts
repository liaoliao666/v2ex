import { isObject } from 'lodash-es'
import { ViewStyle } from 'react-native'

export type ImageResult = {
  width: number
  height: number
  isAnimated?: boolean
}

export type ImageResultWithStatus = ImageResult | 'error' | 'refetching'

export const imageResults = new Map<string, ImageResultWithStatus>()

export const MAX_IMAGE_HEIGHT = 510

export const BROKEN_IMAGE_SIZE = 24

export const isAnimatingImage = (result: ImageResultWithStatus | undefined): boolean => {
  return isObject(result) && 'isAnimated' in result && result.isAnimated === true
}

export const computeOptimalDispalySize = (
  containerWidth: number | undefined,
  result: ImageResultWithStatus | undefined
): ViewStyle => {
  if (!containerWidth || !isObject(result) || typeof result === 'string') {
    return {}
  }

  const { width, height } = result
  const aspectRatio = width / height

  if (width <= containerWidth) {
    return { width, height }
  }

  return {
    width: containerWidth,
    height: containerWidth / aspectRatio,
  }
}
