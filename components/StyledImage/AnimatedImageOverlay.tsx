import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from 'react-native'

import { imageViewerAtom } from '@/jotai/imageViewerAtom'
import { store } from '@/jotai/store'
import tw from '@/utils/tw'
import useLatest from '@/utils/useLatest'

let animatingImage = ''

const animatedListeners = new Set<() => void>()
export const isAnimatingImage = (uri: string) => uri === animatingImage
const setAnimatingImage = (nextAnimatedImage: string) => {
  if (!isAnimatingImage(nextAnimatedImage)) {
    animatingImage = nextAnimatedImage
    animatedListeners.forEach(l => l())
  }
}

store.sub(imageViewerAtom, () => {
  if (store.get(imageViewerAtom)?.visible) {
    setAnimatingImage('')
  }
})

export default function AnimatedImageOverlay({
  update,
  isAnimating,
  uri,
}: {
  isAnimating: boolean
  update: () => void
  uri: string
}) {
  const isAnimatingRef = useLatest(isAnimating)

  useEffect(() => {
    const listener = () => {
      if (isAnimatingImage(uri) !== isAnimatingRef.current) {
        update()
      }
    }

    animatedListeners.add(listener)
    return () => {
      animatedListeners.delete(listener)

      if (!animatedListeners.size) {
        animatingImage = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri])

  return (
    <Pressable
      style={tw`absolute inset-0`}
      onPress={() => {
        setAnimatingImage(uri)
      }}
      disabled={isAnimating}
    >
      {!isAnimating && (
        <View
          style={tw`absolute left-1 top-1 rounded p-0.5 bg-black bg-opacity-50`}
        >
          <View style={tw`border-white border rounded px-1 py-0.5`}>
            <Text style={tw`text-white font-bold text-[10px]`}>GIF</Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}
