import { useAtomValue } from 'jotai'
import { compact, isEqual } from 'lodash-es'
import { memo } from 'react'
import { Text, View } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { Xna } from '@/servicies'
import { isTablet } from '@/utils/tablet'
import tw from '@/utils/tw'
import useUpdate from '@/utils/useUpdate'

import DebouncedPressable from '../DebouncedPressable'
import Separator from '../Separator'
import StyledButton from '../StyledButton'
import StyledImage from '../StyledImage'

export interface XnaItemProps {
  xna: Xna
  hideAvatar?: boolean
}

export default memo(XnaItem, (prev, next) => isEqual(prev.xna, next.xna))

const readedXnaMap = new Map<string, boolean>()

function XnaItem({ xna, hideAvatar }: XnaItemProps) {
  const update = useUpdate()
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
      onPress={() => {
        readedXnaMap.set(xna.id, true)
        update()
        if (isTablet() && getCurrentRouteName() === 'Webview') {
          navigation.replace('Webview', { url: xna.id })
        } else {
          navigation.push('Webview', { url: xna.id })
        }
      }}
    >
      {!hideAvatar && (
        <View>
          <DebouncedPressable
            onPress={() => {
              navigation.push('MemberDetail', {
                username: xna.member?.username!,
              })
            }}
            style={tw`pr-3`}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={xna.member?.avatar}
              priority="high"
            />
          </DebouncedPressable>
        </View>
      )}
      <View style={tw`flex-1`}>
        <View style={tw`flex-row gap-2`}>
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.medium} flex-shrink`}
            numberOfLines={1}
            onPress={() => {
              navigation.push('MemberDetail', {
                username: xna.member?.username!,
              })
            }}
          >
            {xna.member?.username}
          </Text>

          {!!xna.node?.title && (
            <StyledButton
              size="mini"
              type="tag"
              onPress={() => {
                if (isTablet() && getCurrentRouteName() === 'Webview') {
                  navigation.replace('Webview', { url: xna.node?.name! })
                } else {
                  navigation.push('Webview', { url: xna.node?.name! })
                }
              }}
            >
              {xna.node?.title}
            </StyledButton>
          )}

          {xna.pin_to_top && (
            <StyledButton size="mini" color={colors.danger} type="tag" ghost>
              置顶
            </StyledButton>
          )}
        </View>

        <Text
          style={tw.style(
            `${fontSize.medium} pt-1 font-medium`,
            readedXnaMap.has(xna.id)
              ? `text-[${colors.default}]`
              : `text-[${colors.foreground}]`
          )}
        >
          {xna.title}
        </Text>

        <Separator style={tw`mt-1`}>
          {compact([
            <Text
              key="last_touched"
              style={tw`text-[${colors.default}] ${fontSize.small}`}
            >
              {xna.last_touched}
            </Text>,
            !!xna.last_reply_by && (
              <Text
                key="last_reply_by"
                style={tw`text-[${colors.foreground}] ${fontSize.small} flex-1`}
                numberOfLines={1}
              >
                <Text style={tw`text-[${colors.default}] ${fontSize.small}`}>
                  最后回复于
                </Text>
                {xna.last_reply_by}
              </Text>
            ),
          ])}
        </Separator>
      </View>
    </DebouncedPressable>
  )
}
