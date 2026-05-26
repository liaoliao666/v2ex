import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { uiAtom } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

import IconButton from './IconButton'

export default function BottomSheet({
  visible,
  title,
  subtitle,
  children,
  onClose,
}: {
  visible: boolean
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)
  const { height } = useWindowDimensions()
  const safeAreaInsets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(24)).current

  useEffect(() => {
    if (!visible) return
    translateY.setValue(24)
    Animated.timing(translateY, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [translateY, visible])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          gestureState.dy > 8 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_, gestureState) => {
          translateY.setValue(Math.max(0, gestureState.dy))
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 80 || gestureState.vy > 0.8) {
            onClose()
            return
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        },
      }),
    [onClose, translateY]
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end`}>
        <Pressable
          style={tw`absolute inset-0 bg-black bg-opacity-30`}
          onPress={onClose}
        />

        <Animated.View
          style={[
            tw`rounded-t-2xl bg-[${colors.base100}] overflow-hidden`,
            {
              maxHeight: height * 0.9,
              paddingBottom: safeAreaInsets.bottom,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            {...panResponder.panHandlers}
            style={tw`px-4 pt-2 pb-3 border-b border-[${colors.divider}] border-solid`}
          >
            <View
              style={tw`w-10 h-1 rounded-full bg-[${colors.base300}] self-center mb-3`}
            />

            <View style={tw`flex-row items-center`}>
              <View style={tw`flex-1`}>
                <Text
                  style={tw`text-[${colors.foreground}] ${fontSize.large} font-semibold`}
                >
                  {title}
                </Text>
                {!!subtitle && (
                  <Text
                    style={tw`text-[${colors.default}] ${fontSize.small} mt-1`}
                  >
                    {subtitle}
                  </Text>
                )}
              </View>

              <IconButton
                icon={<MaterialCommunityIcons name="close" />}
                size={22}
                color={colors.default}
                activeColor={colors.foreground}
                onPress={onClose}
              />
            </View>
          </View>

          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}
