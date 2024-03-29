import { ViewStyle } from 'react-native'

type ImageResult =
  | { width: number; height: number; isAnimated?: boolean }
  | 'error'
  | 'refetching'

export const imageResults = new Map<string | undefined, ImageResult>()

export const MAX_IMAGE_HEIGHT = 510

export const BROKEN_IMAGE_SIZE = 24

export function computeOptimalDispalySize(
  containerWidth?: number,
  size?: ImageResult
): ViewStyle {
  if (size === 'refetching' || size === 'error') {
    return {
      width: BROKEN_IMAGE_SIZE,
      height: BROKEN_IMAGE_SIZE,
    }
  }

  // Display placeholder size if image size is not available
  if (!size) {
    return {
      aspectRatio: 1,
      width: containerWidth
        ? Math.min(MAX_IMAGE_HEIGHT, containerWidth)
        : `100%`,
    }
  }

  const { width, height } = size

  // Display mini image
  if (width <= 100 && height <= 100) {
    return { width, height }
  }

  const aspectRatio = width / height

  // Display auto fit image
  if (!containerWidth) {
    return {
      aspectRatio,
      width: `100%`,
    }
  }

  // Display small image
  if (
    width <= Math.min(MAX_IMAGE_HEIGHT, containerWidth) &&
    height <= MAX_IMAGE_HEIGHT
  ) {
    return { width, height }
  }

  // Display optimal size
  const actualWidth = Math.min(aspectRatio * MAX_IMAGE_HEIGHT, containerWidth)
  return actualWidth === containerWidth
    ? {
        aspectRatio,
        width: `100%`,
      }
    : {
        width: actualWidth,
        height: actualWidth / aspectRatio,
      }
}
