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

import { useReply } from '@/servicies/topic'
import { validateLoginStatus } from '@/utils/authentication'
import tw from '@/utils/tw'
import useUpdate from '@/utils/useUpdate'

import StyledButton from '../StyledButton'

export interface ReplyBoxRef {
  replyFor: (username?: string) => void
}

const ReplyBox = forwardRef<
  ReplyBoxRef,
  { topicId: number; once?: string; onSuccess: () => void }
>(({ topicId, once, onSuccess }, ref) => {
  const replyMemberRef = useRef<string>()

  const { content, setContent, initContent } = useContent({
    getReplyMember: () => replyMemberRef.current,
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
    replyFor: (username?: string) => {
      try {
        validateLoginStatus()
        replyMemberRef.current = username
        inputRef.current?.focus()
      } catch (error) {
        // empty
      }
    },
  }))

  const { mutateAsync, isLoading } = useReply()

  return (
    <Fragment>
      {isFocus && (
        <Pressable style={tw`bg-mask absolute inset-0`} onPress={blur} />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={tw.style(
            `px-4 bg-body-1 border-t border-solid border-tint-border flex-row items-center`,
            isFocus
              ? `rounded-t-[32px] overflow-hidden`
              : `pt-4 pb-[${Math.max(safeAreaInsets.bottom, 16)}px]`
          )}
        >
          <TextInput
            ref={inputRef}
            placeholderTextColor={tw`text-tint-secondary`.color as string}
            style={tw.style(
              `text-tint-primary flex-1 py-2 px-3`,
              isFocus
                ? `h-20 pt-4 rounded-lg`
                : `h-9 rounded-full bg-[rgb(239,243,244)] dark:bg-[rgb(32,35,39)]`
            )}
            multiline
            numberOfLines={3}
            // value={isFocus ? content : ''}
            placeholder="发送你的评论"
            onChangeText={text => {
              if (isFocus) {
                setContent(text.trim())
              }
            }}
            onFocus={() => {
              initContent()
              inputRef.current?.setNativeProps({
                text: content,
              })
              setIsFocus(true)
            }}
            onBlur={() => {
              setIsFocus(false)
            }}
            autoCapitalize="none"
          />
        </View>

        {isFocus && (
          <View style={tw`py-2 px-4 flex-row justify-end bg-body-1`}>
            <StyledButton
              shape="rounded"
              type="secondary"
              size="small"
              pressable={content.length > 2}
              onPress={async () => {
                validateLoginStatus()

                if (isLoading) return

                try {
                  await mutateAsync({
                    once: once!,
                    topicId,
                    content,
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
              发送
            </StyledButton>
          </View>
        )}
      </KeyboardAvoidingView>
    </Fragment>
  )
})

const cacheContent: {
  replyTopicText: string
  replyMemberText: string
  topicId?: number
  username?: string
} = {
  replyTopicText: '',
  replyMemberText: '',
}

function useContent({
  getReplyMember,
  topicId,
}: {
  getReplyMember: () => string | void
  topicId: number
}) {
  const update = useUpdate()

  function initContent() {
    if (cacheContent.topicId !== topicId) {
      Object.assign(cacheContent, {
        replyTopicText: '',
        replyMemberText: '',
        topicId: topicId,
        username: '',
      })
    }

    if (getReplyMember() && getReplyMember() !== cacheContent.username) {
      Object.assign(cacheContent, {
        replyMemberText: `@${getReplyMember()} `,
        username: getReplyMember(),
      })
    }
  }

  function getTextKey() {
    return getReplyMember() ? 'replyMemberText' : 'replyTopicText'
  }

  function setContent(text: string) {
    cacheContent[getTextKey()] = text
    update()
  }

  return {
    content: cacheContent[getTextKey()],
    setContent,
    initContent,
  } as const
}

export default ReplyBox
