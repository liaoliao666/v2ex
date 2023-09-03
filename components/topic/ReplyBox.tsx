import { useNavigation } from '@react-navigation/native'
import { pick } from 'lodash-es'
import { Fragment, useRef } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'

import { getFontSize } from '@/jotai/fontSacleAtom'
import { useAppendTopic, useReply } from '@/servicies/topic'
import { isSignined } from '@/utils/authentication'
import { convertSelectedTextToBase64 } from '@/utils/convertSelectedTextToBase64'
import tw from '@/utils/tw'
import useUpdate from '@/utils/useUpdate'

import StyledButton from '../StyledButton'
import UploadImageButton from '../UploadImageButton'

export interface ReplyBoxRef {
  replyFor: (replyInfo?: ReplyInfo) => void
}

export type ReplyInfo = {
  topicId: number
  username?: string
  isAppend?: boolean
}

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

const ReplyBox = ({
  once,
  onSuccess,
  replyInfo,
  onCancel,
}: {
  once?: string
  onSuccess: () => void
  replyInfo: ReplyInfo
  onCancel?: () => void
}) => {
  const update = useUpdate()

  const { username, isAppend, topicId } = replyInfo

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

  const inputRef = useRef<TextInput>(null)

  const replyMutation = useReply()

  const appendTopicMutation = useAppendTopic()

  const mutaiton = isAppend ? appendTopicMutation : replyMutation

  const navigation = useNavigation()

  const selectionRef = useRef<{
    start: number
    end: number
  }>()

  return (
    <Fragment>
      <Pressable style={tw`bg-mask absolute inset-0 z-20`} onPress={onCancel} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`z-30`}
      >
        <View
          style={tw`px-4 bg-body-1 flex-row items-center rounded-t-[32px] overflow-hidden`}
        >
          <TextInput
            ref={inputRef}
            placeholderTextColor={tw.color(`text-tint-secondary`)}
            style={tw.style(
              {
                ...pick(tw.style(getFontSize(5)), ['fontSize']),
                paddingVertical: 0,
              },
              `text-tint-primary flex-1 py-2 px-3 h-32 pt-4 rounded-lg`
            )}
            textAlignVertical={'top'}
            multiline
            numberOfLines={3}
            placeholder={isAppend ? '发送你的附言' : '发送你的评论'}
            onChangeText={function handleAtName(text) {
              if (text.match(/(@|＠)$/)) {
                navigation.navigate('SearchReplyMember', {
                  topicId,
                  onAtNames(atNames) {
                    setContent(
                      atNames
                        ? `${text.slice(0, text.length - 1)}${atNames} `
                        : text
                    )

                    if (Platform.OS === 'android') {
                      inputRef.current?.focus()
                    }
                  },
                })
                return
              }

              const isDeleting = text.length < getContent().length
              const lastAtName = getContent().match(/((@|＠)\w+)$/)?.[1]

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
            autoFocus={true}
            onFocus={() => {
              initContent()
              inputRef.current?.setNativeProps({
                text: getContent(),
              })
            }}
            onBlur={onCancel}
            onSelectionChange={ev => {
              selectionRef.current = ev.nativeEvent.selection
            }}
            autoCapitalize="none"
          />
        </View>

        <View style={tw`py-2 px-4 flex-row bg-body-1`}>
          <View style={tw`flex-row gap-2 mr-auto`}>
            <StyledButton
              shape="rounded"
              type="secondary"
              size="small"
              onPress={() => {
                const replacedText = convertSelectedTextToBase64(
                  getContent(),
                  selectionRef.current
                )

                if (replacedText) {
                  setContent(replacedText)
                  inputRef.current?.setNativeProps({
                    text: replacedText,
                  })
                }
              }}
            >
              + Base64
            </StyledButton>

            <UploadImageButton
              shape="rounded"
              size="small"
              type="secondary"
              onUploaded={url => {
                const newContent = getContent()
                  ? `${getContent()}\n${url}`
                  : url

                setContent(newContent)
                inputRef.current?.setNativeProps({
                  text: newContent,
                })
              }}
            />
          </View>

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

              const { isPending, mutateAsync } = mutaiton

              if (isPending) return

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
            {mutaiton.isPending ? '发送中' : '发送'}
          </StyledButton>
        </View>
      </KeyboardAvoidingView>
    </Fragment>
  )
}

export default ReplyBox
