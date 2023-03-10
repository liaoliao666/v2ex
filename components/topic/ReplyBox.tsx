import { useNavigation } from '@react-navigation/native'
import { pick } from 'lodash-es'
import {
  Fragment,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { useAppendTopic, useReply } from '@/servicies/topic'
import { isSignined } from '@/utils/authentication'
import tw from '@/utils/tw'
import useUpdate from '@/utils/useUpdate'

import StyledButton from '../StyledButton'

export interface ReplyBoxRef {
  replyFor: (replyTYpe?: ReplyType) => void
}

type ReplyType = { username?: string; isAppend?: boolean }

const ReplyBox = forwardRef<
  ReplyBoxRef,
  { topicId: number; once?: string; onSuccess: () => void }
>(({ topicId, once, onSuccess }, ref) => {
  const replyTypeRef = useRef<ReplyType>({})

  const { getContent, setContent, initContent } = useContent({
    getReplyType: () => replyTypeRef.current,
    topicId,
  })

  function blur() {
    inputRef.current?.blur()
    inputRef.current?.clear()
  }

  const [isFocus, setIsFocus] = useState(false)

  const safeAreaInsets = useSafeAreaInsets()

  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    replyFor: (replyType?: ReplyType) => {
      if (!isSignined()) {
        navigation.navigate('Login')
        return
      }
      replyTypeRef.current = replyType || {}
      inputRef.current?.focus()
    },
  }))

  const replyMutation = useReply()

  const appendTopicMutation = useAppendTopic()

  function isAppend() {
    return !!replyTypeRef.current.isAppend
  }

  function getMutation() {
    return isAppend() ? appendTopicMutation : replyMutation
  }

  const navigation = useNavigation()

  return (
    <Fragment>
      {isFocus && (
        <Pressable style={tw`bg-mask absolute inset-0 z-20`} onPress={blur} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`z-30`}
      >
        <View
          style={tw.style(
            `px-4 bg-body-1 flex-row items-center`,
            isFocus
              ? `rounded-t-[32px] overflow-hidden`
              : `pt-4 pb-[${Math.max(
                  safeAreaInsets.bottom,
                  16
                )}px] border-b-0 border-t border-solid border-tint-border`
          )}
        >
          <TextInput
            ref={inputRef}
            placeholderTextColor={tw.color(`text-tint-secondary`)}
            style={tw.style(
              {
                ...pick(tw.style(getFontSize(5)), ['fontSize']),
                paddingVertical: 0,
              },
              `text-tint-primary flex-1 py-2 px-3`,
              isFocus
                ? `h-20 pt-4 rounded-lg`
                : `h-9 rounded-full bg-[rgb(239,243,244)] dark:bg-[rgb(32,35,39)]`
            )}
            textAlignVertical={'top'}
            multiline
            numberOfLines={3}
            placeholder={isAppend() ? '发送你的附言' : '发送你的评论'}
            onChangeText={function handleAtName(text) {
              if (!isFocus) return

              if (text.endsWith('@')) {
                navigation.navigate('SearchReplyMember', {
                  topicId,
                  onPressReplyMemberItem(member) {
                    setContent(`${text}${member.username} `)
                  },
                })
                return
              }

              const isDeleting = text.length < getContent().length
              const lastAtName = getContent().match(/(@\w+)$/)?.[1]

              if (isDeleting && lastAtName) {
                const prunedText = text.slice(
                  0,
                  text.length - lastAtName.length + 1
                )
                setContent(prunedText)
                inputRef.current?.setNativeProps({
                  text: prunedText,
                })
              } else {
                setContent(text)
              }
            }}
            onFocus={() => {
              initContent()
              inputRef.current?.setNativeProps({
                text: getContent(),
              })
              setIsFocus(true)
            }}
            onBlur={() => {
              setIsFocus(false)
            }}
            autoCapitalize="none"
          />
        </View>

        <View
          style={tw.style(
            `py-2 px-4 flex-row justify-end bg-body-1`,
            !isFocus && `hidden`
          )}
        >
          <StyledButton
            shape="rounded"
            type="secondary"
            size="small"
            pressable={!!getContent().trim()}
            onPress={async () => {
              if (!isSignined()) {
                navigation.navigate('Login')
                return
              }

              const { isLoading, mutateAsync } = getMutation()

              if (isLoading) return

              try {
                await mutateAsync({
                  once: once!,
                  topicId,
                  content: getContent().trim(),
                })

                blur()
                setContent('')
                onSuccess()
                Toast.show({
                  type: 'success',
                  text1: '发送成功',
                })
              } catch (error) {
                Toast.show({
                  type: 'error',
                  text1: '发送失败',
                })
              }
            }}
          >
            {getMutation().isLoading ? '发送中' : '发送'}
          </StyledButton>
        </View>
      </KeyboardAvoidingView>
    </Fragment>
  )
})

const cacheContent: {
  replyTopicText: string
  replyMemberText: string
  appendText: string
  topicId?: number
  replyName?: string
} = {
  replyTopicText: '',
  replyMemberText: '',
  appendText: '',
}

function useContent({
  getReplyType,
  topicId,
}: {
  getReplyType: () => ReplyType
  topicId: number
}) {
  const update = useUpdate()

  function initContent() {
    if (cacheContent.topicId !== topicId) {
      Object.assign(cacheContent, {
        replyTopicText: '',
        replyMemberText: '',
        appendText: '',
        topicId: topicId,
        replyName: '',
      })
    }

    const { username } = getReplyType()

    if (username) {
      if (username !== cacheContent.replyName) {
        Object.assign(cacheContent, {
          replyMemberText: `@${username} `,
          replyName: username,
        })
      } else if (!getContent().trim()) {
        Object.assign(cacheContent, {
          replyMemberText: `@${username} `,
        })
      }
    }
  }

  function getTextKey() {
    const { username, isAppend } = getReplyType()
    return username
      ? 'replyMemberText'
      : isAppend
      ? 'appendText'
      : 'replyTopicText'
  }

  function setContent(text: string) {
    cacheContent[getTextKey()] = text
    update()
  }

  function getContent() {
    return cacheContent[getTextKey()]
  }

  return {
    getContent,
    setContent,
    initContent,
  } as const
}

export default ReplyBox
