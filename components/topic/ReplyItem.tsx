import { useActionSheet } from '@expo/react-native-action-sheet'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { produce } from 'immer'
import { compact, find, findIndex, isBoolean } from 'lodash-es'
import { useMutation } from 'quaere'
import { Fragment, memo, useState } from 'react'
import { Platform, Pressable, Share, Text, View, ViewProps } from 'react-native'
import Toast from 'react-native-toast-message'

import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import {
  ignoreReplyMutation,
  thankReplyMutation,
  topicDetailQuery,
} from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { isSelf, isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import { baseURL } from '@/utils/request/baseURL'
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
}: {
  topicId: number
  once?: string
  reply: Reply
  hightlight?: boolean
  onReply: (username: string) => void
  related?: boolean
  inModalScreen?: boolean
  onLayout?: ViewProps['onLayout']
}) {
  const [isParsing, setIsParsing] = useState(
    store.get(enabledParseContentAtom)!
  )

  return (
    <View
      style={tw.style(
        `px-4 py-3`,
        hightlight ? `bg-content` : `bg-background`,
        isBoolean(related) && !related && `opacity-64`
      )}
      onLayout={onLayout}
    >
      <View style={tw`flex-row`}>
        <View style={tw`mr-3`}>
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
              source={{
                uri: reply.member?.avatar,
              }}
            />
          </Pressable>
        </View>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-row gap-2 mr-auto`}>
              <Text
                key="username"
                style={tw`text-foreground ${getFontSize(5)} font-medium`}
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
                      `px-1 bg-primary border-primary border border-solid rounded-sm`,
                      reply.op && `rounded-r-none`
                    )}
                  >
                    <Text style={tw`text-white`}>MOD</Text>
                  </View>
                )}
                {reply.op && (
                  <View
                    style={tw.style(
                      `px-1 border-primary border border-solid rounded-sm`,
                      reply.mod && `rounded-l-none`
                    )}
                  >
                    <Text style={tw`text-primary`}>OP</Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={tw`${getFontSize(6)} text-default`}>#{reply.no}</Text>
          </View>

          <Separator>
            {compact([
              <Text key={'created'} style={tw`text-default ${getFontSize(6)}`}>
                {reply.created}
              </Text>,

              reply.parsed_content && (
                <Text
                  key={'isParsing'}
                  style={tw`text-default ${getFontSize(6)}`}
                  onPress={() => {
                    setIsParsing(!isParsing)
                  }}
                >
                  {isParsing ? `显示原始回复` : `隐藏原始回复`}
                </Text>
              ),
            ])}
          </Separator>

          <View style={tw`pt-0.5`}>
            <Html
              source={{
                html:
                  isParsing && reply.parsed_content
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
                <Text style={tw`${getFontSize(5)} text-default`}>
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
                      color={tw.color(`text-default`)}
                      activeColor={tw.color(`text-primary`)}
                      size={15}
                      icon={<Feather name="message-circle" />}
                    />

                    <Text style={tw`pl-1 ${getFontSize(6)} text-default`}>
                      回复
                    </Text>
                  </Fragment>
                )}
              </Pressable>

              {reply.has_related_replies && !inModalScreen && (
                <Pressable
                  onPress={() => {
                    navigation.navigate('RelatedReplies', {
                      replyId: reply.id,
                      topicId,
                      onReply: username => {
                        navigation.goBack()
                        sleep(300).then(() => onReply(username))
                      },
                    })
                  }}
                  style={tw`flex-row items-center`}
                >
                  {({ pressed }) => (
                    <Fragment>
                      <IconButton
                        pressed={pressed}
                        color={tw.color(`text-default`)}
                        activeColor={tw.color(`text-foreground`)}
                        size={15}
                        icon={<FontAwesome5 name="comments" />}
                      />

                      <Text style={tw`pl-1 ${getFontSize(6)} text-default`}>
                        查看评论
                      </Text>
                    </Fragment>
                  )}
                </Pressable>
              )}
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
  const { trigger, isMutating } = useMutation({ mutation: thankReplyMutation })

  const disabled = isSelf(reply.member.username) || reply.thanked

  return (
    <Pressable
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isMutating || disabled) return

        await confirm(
          `确认花费 10 个铜币向 @${reply.member.username} 的这条回复发送感谢？`
        )

        try {
          updateReply(topicId, {
            id: reply.id,
            thanked: !reply.thanked,
            thanks: reply.thanks + 1,
          })

          await trigger({
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
            text1: '发送感谢失败',
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
            color={reply.thanks ? `rgb(249,24,128)` : tw.color(`text-default`)}
            activeColor={'rgb(249,24,128)'}
            pressed={disabled ? false : pressed}
          />

          <Text
            style={tw.style(
              `${getFontSize(6)} pl-0.5`,
              reply.thanks ? `text-[rgb(249,24,128)]` : `text-default`
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

  const ignoreReplyResult = useMutation({ mutation: ignoreReplyMutation })

  return (
    <IconButton
      name="dots-horizontal"
      color={tw.color(`text-default`)}
      activeColor={tw.color(`text-foreground`)}
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
                const url = `${baseURL}/t/${topicId}?p=${Math.ceil(
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

                if (ignoreReplyResult.isMutating) return

                await confirm('确定隐藏该回复么?')

                try {
                  await ignoreReplyResult.trigger({
                    id: reply.id,
                    once: once!,
                  })

                  queryClient.setQueryData(
                    {
                      query: topicDetailQuery,
                      variables: { id: topicId },
                    },
                    produce(draft => {
                      if (!draft) return
                      for (const page of draft.pages) {
                        const i = findIndex(page.replies, { id: reply.id })
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
    {
      query: topicDetailQuery,
      variables: { id: topicId },
    },
    produce(data => {
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
