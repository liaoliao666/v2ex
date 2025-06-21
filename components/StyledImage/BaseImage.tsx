import { parseToRgba } from 'color2k'
import { View, ViewStyle, ImageURISource } from 'react-native'
import FastImage, { FastImageProps, OnLoadEvent, Source } from 'react-native-fast-image'
import { useAtomValue, useAtom } from 'jotai'
import { isEqual, isObject, memoize, pick } from 'lodash-es'
import { useCallback, useEffect, useMemo } from 'react'

import { uiAtom } from '@/jotai/uiAtom'
import { hasSize } from '@/utils/hasSize'
import tw from '@/utils/tw'
import { genBMPUri } from '@/utils/url'
import useUpdate from '@/utils/useUpdate'

import AnimatedImageOverlay, { isAnimatingImage } from './AnimatedImageOverlay'
import BrokenImage from './BrokenImage'
import { imageResults } from './helper'
import { computeOptimalDispalySize } from './helper'
import { createImageStateAtom } from './imageStateAtom'

export interface BaseImageProps extends Omit<FastImageProps, 'source'> {
  source: ImageURISource
  containerWidth?: number
  autoplay?: boolean
  allowDownscaling?: boolean
  priority?: 'low' | 'normal' | 'high'
}

const genPlaceholder = memoize((color: string) => {
  const [r, g, b, a = 1] = parseToRgba(color)
  return genBMPUri(1, [b, g, r, parseInt(String(a * 255), 10)])
})

const failedImages = new Set<() => void>()

export function BaseImage({
  style,
  source,
  onLoad,
  onError,
  containerWidth,
  autoplay,
  allowDownscaling,
  ...props
}: BaseImageProps) {
  const { colors } = useAtomValue(uiAtom)
  const uri = (source as ImageURISource).uri
  
  // 为当前 URI 创建状态 atom
  const imageStateAtom = useMemo(() => createImageStateAtom(uri || ''), [uri])
  const [imageState, setImageState] = useAtom(imageStateAtom)
  const { isLoading, hasError } = imageState

  const result = imageResults.get(uri || '')
  const update = useUpdate()
  const hasPassedSize = hasSize(style)
  
  // 转换 source 为 FastImage 期望的格式
  const fastImageSource = {
    uri: uri || '',
    priority: props.priority === 'high' ? FastImage.priority.high : 
              props.priority === 'low' ? FastImage.priority.low : 
              FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable
  }
  
  const imageProps: FastImageProps = {
    ...props,
    source: fastImageSource,
    resizeMode: FastImage.resizeMode.cover,
    onLoadStart: () => {
      setImageState({ isLoading: true, hasError: false })
    },
    onLoad: (ev: OnLoadEvent) => {
      setImageState({ isLoading: false, hasError: false })
      const { width, height } = ev.nativeEvent
      const nextImageResult = {
        width,
        height,
        isAnimated: false,
        mediaType: 'image'
      }
      if (!isEqual(result, nextImageResult)) {
        imageResults.set(uri || '', nextImageResult)
        if (!hasPassedSize) update()
      }
      onLoad?.(ev)
    },
    onError: () => {
      setImageState({ isLoading: false, hasError: true })
      if (!hasSize(result)) {
        imageResults.set(uri || '', 'error')
        update()
      }
      onError?.()
    },
    style: tw.style(
      !hasPassedSize && computeOptimalDispalySize(containerWidth, result),
      style as ViewStyle
    ),
  }

  const refetch = useCallback(() => {
    imageResults.set(uri || '', 'refetching')
    setImageState({ isLoading: true, hasError: false })
    update()
  }, [update, uri, setImageState])

  useEffect(() => {
    if (result === 'error' && uri) {
      failedImages.add(refetch)
    }

    return () => {
      failedImages.delete(refetch)
    }
  }, [refetch, result, uri])

  if (!uri) return <View style={style as any} {...props} />

  if (hasError) {
    return (
      <View
        style={tw.style(
          !hasPassedSize && computeOptimalDispalySize(containerWidth, result),
          `bg-[${colors.neutral}]`,
          style as ViewStyle
        )}
      >
        <BrokenImage
          onPress={() => {
            if (failedImages.size > 10) {
              failedImages.forEach(l => l())
            } else {
              refetch()
            }
          }}
          style={tw`absolute inset-0`}
        />
      </View>
    )
  }

  if (autoplay === false) {
    const isAnimating = isAnimatingImage(uri)
    const isMiniImage =
      isObject(result) && result.width < 50 && result.height < 50

    return (
      <View style={imageProps.style}>
        <FastImage {...imageProps} />
        {isObject(result) && !isMiniImage && result.isAnimated && (
          <AnimatedImageOverlay
            isAnimating={isAnimating}
            update={update}
            uri={uri}
          />
        )}
      </View>
    )
  }

  return <FastImage {...imageProps} />
}
