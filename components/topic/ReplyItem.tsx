import { useActionSheet } from '@expo/react-native-action-sheet'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { compact, find, findIndex, isBoolean } from 'lodash-es'
import { Fragment, memo, useState } from 'react'
import { Platform, Pressable, Share, Text, View, ViewProps } from 'react-native'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

import { v2exURL } from '@/jotai/baseUrlAtom'
import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Reply, k } from '@/servicies'
import { isSelf, isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import { sleep } from '@/utils/sleep'
import tw from '@/utils/tw'

import Html from '../Html'
import IconButton from '../IconButton'
import Separator from '../Separator'
import StyledImage from '../StyledImage'

export default memo(
  ReplyItem,
  (prev, next) =>
    prev.reply.thanked === next.reply.thanked &&
    prev.reply.created === next.reply.created &&
    prev.once === next.once
)

function ReplyItem({
  reply,
  topicId,
  once,
  hightlight,
  onReply,
  related,
  inModalScreen,
  onLayout,
  showNestedReply = true,
}: {
  topicId: number
  once?: string
  reply: Reply
  hightlight?: boolean
  onReply: (username: string) => void
  related?: boolean
  inModalScreen?: boolean
  onLayout?: ViewProps['onLayout']
  showNestedReply?: boolean
}) {
  const [isParsed, setIsParsed] = useState(store.get(enabledParseContentAtom)!)
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <View
      style={tw.style(
        `px-4`,
        hightlight ? `bg-[${colors.base200}]` : `bg-[${colors.base100}]`,
        isBoolean(related) && !related && `opacity-64`
      )}
      onLayout={onLayout}
    >
      <View style={tw`flex-row`}>
        {!showNestedReply
          ? null
          : Array.from({ length: reply.replyLevel }, (_, i) => (
              <View
                key={i}
                style={tw.style(`w-0.3 bg-gray-300`, `ml-${i * 5 + 4}`)}
              />
            ))}
        <View style={tw.style(`mt-3`, `ml-1`)}>
          <Pressable
            onPress={() => {
              if (inModalScreen) {
                navigation.goBack()
              } else {
                navigation.push('MemberDetail', {
                  username: reply.member?.username!,
                })
              }
            }}
          >
            <StyledImage
              style={tw`w-6 h-6 rounded-full`}
              source={reply.member?.avatar}
            />
          </Pressable>
        </View>
        <View style={tw.style(`flex-1`, `py-3`, `ml-1`)}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-row gap-2 mr-auto`}>
              <Text
                key="username"
                style={tw`text-[${colors.foreground}] ${fontSize.medium} font-medium`}
                onPress={() => {
                  if (inModalScreen) navigation.goBack()
                  navigation.push('MemberDetail', {
                    username: reply.member?.username!,
                  })
                }}
              >
                {reply.member?.username}
              </Text>

              <View style={tw`flex-row items-center`}>
                {reply.mod && (
                  <View
                    style={tw.style(
                      `px-1 bg-[${colors.primary}] border-[${colors.primary}] border border-solid rounded-sm`,
                      reply.op && `rounded-r-none`
                    )}
                  >
                    <Text style={tw`text-white`}>MOD</Text>
                  </View>
                )}
                {reply.op && (
                  <View
                    style={tw.style(
                      `px-1 border-[${colors.primary}] border border-solid rounded-sm`,
                      reply.mod && `rounded-l-none`
                    )}
                  >
                    <Text style={tw`text-[${colors.primary}]`}>OP</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={tw`${fontSize.small} text-[${colors.default}]`}>
              #{reply.no}
            </Text>
          </View>
          <Separator>
            {compact([
              <Text
                key={'created'}
                style={tw`text-[${colors.default}] ${fontSize.small}`}
              >
                {reply.created}
              </Text>,

              reply.parsed_content && (
                <Text
                  key={'isParsed'}
                  style={tw`text-[${colors.default}] ${fontSize.small}`}
                  onPress={() => {
                    setIsParsed(!isParsed)
                  }}
                >
                  {isParsed ? `显示原始回复` : `隐藏原始回复`}
                </Text>
              ),
            ])}
          </Separator>

          <View style={tw`pt-0.5`}>
            <Html
              source={{
                html:
                  isParsed && reply.parsed_content
                    ? reply.parsed_content
                    : reply.content,
              }}
              inModalScreen={inModalScreen}
              paddingX={32 + 36}
            />
          </View>

          <View style={tw`flex-row items-center pt-2`}>
            <View style={tw`flex-row gap-4 mr-auto`}>
              {isBoolean(related) && !related && (
                <Text style={tw`${fontSize.medium} text-[${colors.default}]`}>
                  可能是无关内容
                </Text>
              )}
              {!(isSelf(reply.member.username) && !reply.thanks) && (
                <ThankReply topicId={topicId} once={once} reply={reply} />
              )}

              <Pressable
                onPress={() => onReply(reply.member.username)}
                style={tw`flex-row items-center`}
              >
                {({ pressed }) => (
                  <Fragment>
                    <IconButton
                      pressed={pressed}
                      color={colors.default}
                      activeColor={colors.primary}
                      size={15}
                      icon={<Feather name="message-circle" />}
                    />

                    <Text
                      style={tw`pl-1 ${fontSize.small} text-[${colors.default}]`}
                    >
                      回复
                    </Text>
                  </Fragment>
                )}
              </Pressable>
            </View>

            <MoreButton once={once} reply={reply} topicId={topicId} />
          </View>
        </View>
      </View>
    </View>
  )
}

function ThankReply({
  reply,
  once,
  topicId,
}: {
  topicId: number
  once?: string
  reply: Reply
}) {
  const { mutateAsync, isPending } = k.reply.thank.useMutation()

  const disabled = isSelf(reply.member.username) || reply.thanked

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <Pressable
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isPending || disabled) return

        await confirm(
          `确认花费 10 个铜币向 @${reply.member.username} 的这条回复发送感谢？`
        )

        try {
          updateReply(topicId, {
            id: reply.id,
            thanked: !reply.thanked,
            thanks: reply.thanks + 1,
          })

          await mutateAsync({
            id: reply.id,
            once: once!,
          })
        } catch (error) {
          updateReply(topicId, {
            id: reply.id,
            thanked: reply.thanked,
            thanks: reply.thanks,
          })

          Toast.show({
            type: 'error',
            text1: error instanceof BizError ? error.message : '发送感谢失败',
          })
        }
      }}
      style={tw.style(`flex-row items-center`)}
    >
      {({ pressed }) => (
        <Fragment>
          <IconButton
            size={16}
            active={reply.thanked}
            name={reply.thanked ? 'heart' : 'heart-outline'}
            color={reply.thanks ? colors.heart : colors.default}
            activeColor={colors.heart}
            pressed={disabled ? false : pressed}
          />

          <Text
            style={tw.style(
              `${fontSize.small} pl-0.5`,
              reply.thanks
                ? `text-[${colors.heart}]`
                : `text-[${colors.default}]`
            )}
          >
            {reply.thanks ? reply.thanks : '感谢'}
          </Text>
        </Fragment>
      )}
    </Pressable>
  )
}

function MoreButton({
  topicId,
  reply,
  once,
}: {
  topicId: number
  reply: Reply
  once?: string
}) {
  const { showActionSheetWithOptions } = useActionSheet()

  const ignoreReplyMutation = k.reply.ignore.useMutation()

  const { colors } = useAtomValue(uiAtom)

  return (
    <IconButton
      name="dots-horizontal"
      color={colors.default}
      activeColor={colors.foreground}
      size={16}
      onPress={() => {
        const options = compact([
          !isSelf(reply.member.username) && '隐藏',
          '分享',
          '取消',
        ])
        const destructiveButtonIndex = options.indexOf('隐藏')
        const cancelButtonIndex = options.indexOf('取消')

        showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
            userInterfaceStyle: store.get(colorSchemeAtom),
          },
          async selectedIndex => {
            switch (selectedIndex) {
              case options.indexOf('分享'):
                const url = `${v2exURL}/t/${topicId}?p=${Math.ceil(
                  reply.no / 100
                )}#r_${reply.id}`
                Share.share(
                  Platform.OS === 'android'
                    ? {
                        title: reply.content,
                        message: url,
                      }
                    : {
                        title: reply.content,
                        url: url,
                      }
                )
                break

              case destructiveButtonIndex: {
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                if (ignoreReplyMutation.isPending) return

                await confirm('确定隐藏该回复么?')

                try {
                  await ignoreReplyMutation.mutateAsync({
                    id: reply.id,
                    once: once!,
                  })

                  queryClient.setQueryData(
                    k.topic.detail.getKey({ id: topicId }),
                    produce<inferData<typeof k.topic.detail>>(draft => {
                      if (!draft) return
                      for (const page of draft.pages) {
                        const i = findIndex(page.replies, {
                          id: reply.id,
                        })
                        if (i > -1) {
                          page.replies.splice(i, 1)
                          break
                        }
                      }
                    })
                  )

                  Toast.show({
                    type: 'success',
                    text1: '隐藏成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1:
                      error instanceof BizError ? error.message : '隐藏失败',
                  })
                }
                break
              }

              case cancelButtonIndex:
              // Canceled
            }
          }
        )
      }}
    />
  )
}

function updateReply(topicId: number, reply: Partial<Reply>) {
  queryClient.setQueryData(
    k.topic.detail.getKey({ id: topicId }),
    produce<inferData<typeof k.topic.detail>>(data => {
      for (const topic of data?.pages || []) {
        const result = find(topic.replies, { id: reply.id })

        if (result) {
          Object.assign(result, reply)
          break
        }
      }
    })
  )
}
