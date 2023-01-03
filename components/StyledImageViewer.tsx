import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import ImageView from 'react-native-image-viewing'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { savePicture } from '@/utils/savePicture'
import tw from '@/utils/tw'

const StyledImageViewer: typeof ImageView = props => {
  const safeAreaInsets = useSafeAreaInsets()

  const [menuVisible, setMenuVisible] = useState(false)

  const FooterComponent = useCallback(() => {
    return (
      <Pressable
        onPress={() => {
          setMenuVisible(false)
        }}
        style={tw`bg-mask h-screen`}
      >
        <View
          style={tw.style(
            `bg-body-1 absolute bottom-0 inset-x-0 rounded-t-[32px] overflow-hidden`,
            {
              paddingBottom: safeAreaInsets.bottom,
            }
          )}
        >
          {[
            {
              label: '保存',
              value: 'saveToLocal',
              onPress: async () => {
                try {
                  const { images, imageIndex } = props

                  await savePicture((images[imageIndex] as any).uri)
                  Toast.show({
                    type: 'success',
                    text1: '保存成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '保存失败',
                  })
                }
              },
            },
            {
              label: '取消',
              value: 'cancel',
              onPress: () => {
                setMenuVisible(false)
              },
            },
          ].map(item => (
            <Pressable
              key={item.value}
              onPress={item.onPress}
              style={({ pressed }) =>
                tw.style(
                  `h-[53px] justify-center items-center border-tint-border border-t border-solid`,
                  pressed && `bg-message-press`
                )
              }
            >
              <Text style={tw`text-body-5 text-tint-primary`}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ImageView
      {...props}
      onLongPress={() => {
        setMenuVisible(true)
      }}
      keyExtractor={image => (image as any).uri}
      FooterComponent={
        menuVisible
          ? FooterComponent
          : ({ imageIndex }) => (
              <ImageFooter
                imageIndex={imageIndex}
                imagesCount={props.images.length}
              />
            )
      }
    />
  )
}

function ImageFooter({
  imageIndex,
  imagesCount,
}: {
  imageIndex: number
  imagesCount: number
}) {
  const safeAreaInsets = useSafeAreaInsets()

  return (
    <View
      style={tw`px-4 flex-row justify-center pb-[${safeAreaInsets.bottom}px]`}
    >
      <Text style={tw`text-white text-body-4`}>
        {imageIndex + 1 + '/' + imagesCount}
      </Text>
    </View>
  )
}

export default StyledImageViewer
