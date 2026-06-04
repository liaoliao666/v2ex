import { useActionSheet } from '@expo/react-native-action-sheet'
import { Feather, FontAwesome5 } from '@expo/vector-icons'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { compact, find, findIndex, isBoolean, isEmpty } from 'lodash-es'
import { Fragment, memo, useMemo, useState } from 'react'
import { Platform, Pressable, Share, Text, View, ViewProps } from 'react-native'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

import { v2exURL } from '@/jotai/baseUrlAtom'
import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { themeNameAtom, uiAtom } from '@/jotai/uiAtom'
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
    prev.once === next.once &&
    prev.showLegacyUi === next.showLegacyUi &&
    prev.showNestedReply === next.showNestedReply &&
    prev.collapsed === next.collapsed &&
    prev.hightlight === next.hightlight &&
    prev.related === next.related &&
    prev.inModalScreen === next.inModalScreen &&
    prev.highlightedCollapseReplyId === next.highlightedCollapseReplyId &&
    prev.collapsibleReplyIds === next.collapsibleReplyIds &&
    prev.onReply === next.onReply &&
    prev.onToggleCollapse === next.onToggleCollapse &&
    prev.onToggleCollapsePressIn === next.onToggleCollapsePressIn &&
    prev.onToggleCollapsePressOut === next.onToggleCollapsePressOut &&
    prev.onToggleLineCollapse === next.onToggleLineCollapse &&
    prev.onToggleLineCollapsePressIn === next.onToggleLineCollapsePressIn &&
    prev.onToggleLineCollapsePressOut === next.onToggleLineCollapsePressOut &&
    (prev.reply === next.reply ||
      (prev.reply.id === next.reply.id &&
        prev.reply.no === next.reply.no &&
        prev.reply.content === next.reply.content &&
        prev.reply.parsed_content === next.reply.parsed_content &&
        prev.reply.created === next.reply.created &&
        prev.reply.member.username === next.reply.member.username &&
        prev.reply.member.avatar === next.reply.member.avatar &&
        prev.reply.thanks === next.reply.thanks &&
        prev.reply.thanked === next.reply.thanked &&
        prev.reply.mod === next.reply.mod &&
        prev.reply.op === next.reply.op &&
        prev.reply.reply_level === next.reply.reply_level &&
        prev.reply.is_merged === next.reply.is_merged &&
        prev.reply.reply_connectors?.join() ===
          next.reply.reply_connectors?.join() &&
        prev.reply.reply_has_nested_children ===
          next.reply.reply_has_nested_children &&
        prev.reply.reply_has_merged_children ===
          next.reply.reply_has_merged_children &&
        prev.reply.children?.length === next.reply.children?.length &&
        prev.reply.is_last_reply === next.reply.is_last_reply))
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
  showLegacyUi = true,
  collapsed = false,
  highlightedCollapseReplyId,
  collapsibleReplyIds,
  onToggleCollapse,
  onToggleCollapsePressIn,
  onToggleCollapsePressOut,
  onToggleLineCollapse,
  onToggleLineCollapsePressIn,
  onToggleLineCollapsePressOut,
}: {
  topicId: number
  once?: string
  reply: Reply
  hightlight?: boolean
  onReply: (username: string, replyNo?: number) => void
  related?: boolean
  inModalScreen?: boolean
  onLayout?: ViewProps['onLayout']
  showNestedReply?: boolean
  showLegacyUi?: boolean
  collapsed?: boolean
  highlightedCollapseReplyId?: number
  collapsibleReplyIds?: Set<number>
  onToggleCollapse?: () => void
  onToggleCollapsePressIn?: () => void
  onToggleCollapsePressOut?: () => void
  onToggleLineCollapse?: (replyId: number) => void
  onToggleLineCollapsePressIn?: (replyId: number) => void
  onToggleLineCollapsePressOut?: () => void
}) {
  const [isParsed, setIsParsed] = useState(store.get(enabledParseContentAtom)!)
  const themeName = useAtomValue(themeNameAtom)
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors, fontSize } = useAtomValue(uiAtom)
  const replyLevel = showNestedReply ? reply.reply_level || 0 : 0
  const replyConnectors = reply.reply_connectors || []
  const shouldUseNestedUi = !showLegacyUi && showNestedReply
  const connectorTurnHeight = shouldUseNestedUi ? 20 : 12
  const dividerColor =
    !themeName.light && colorScheme === 'light'
      ? 'rgb(207,217,222)'
      : !themeName.dark && colorScheme === 'dark'
      ? 'rgb(51,54,57)'
      : colors.divider
  function getLineColor(replyId?: number) {
    return replyId !== undefined && highlightedCollapseReplyId === replyId
      ? colors.foreground
      : dividerColor
  }

  function getCollapsibleAncestorId(level: number) {
    const ancestorId = reply.reply_ancestor_ids?.[level]
    return ancestorId !== undefined && collapsibleReplyIds?.has(ancestorId)
      ? ancestorId
      : undefined
  }

  const parentLineReplyId =
    replyLevel > 0 ? getCollapsibleAncestorId(replyLevel - 1) : undefined
  const ownLineColor =
    highlightedCollapseReplyId === reply.id && reply.reply_has_nested_children
      ? colors.foreground
      : dividerColor
  const itemBackgroundColor = hightlight ? colors.base200 : colors.base100
  const shouldShowCollapsedGap = !showLegacyUi && showNestedReply && collapsed
  const shouldShowMergedContinuation =
    !showLegacyUi && showNestedReply && reply.is_merged && !reply.is_last_reply
  const replyHtml =
    isParsed && reply.parsed_content ? reply.parsed_content : reply.content
  const replyHtmlSource = useMemo(() => ({ html: replyHtml }), [replyHtml])
  const hasVisibleReplyChildren =
    reply.reply_has_nested_children ||
    reply.reply_has_merged_children ||
    (reply.reply_has_nested_children === undefined &&
      reply.reply_has_merged_children === undefined &&
      !isEmpty(reply.children))

  return (
    <View
      style={tw.style(
        `px-4`,
        showLegacyUi && `py-3`,
        shouldUseNestedUi && `pt-2`,
        shouldShowCollapsedGap && `pb-2`,
        `bg-[${itemBackgroundColor}]`,
        isBoolean(related) && !related && `opacity-64`
      )}
      onLayout={onLayout}
    >
      {!showNestedReply || showLegacyUi ? null : (
        <>
          {replyConnectors.map((isActive, i) => {
            if (!isActive) return null

            const connectorReplyId = getCollapsibleAncestorId(i)

            return connectorReplyId !== undefined &&
              onToggleLineCollapse &&
              onToggleLineCollapsePressIn ? (
              <Pressable
                key={`connector-${i}`}
                onPress={() => onToggleLineCollapse(connectorReplyId)}
                onPressIn={() => onToggleLineCollapsePressIn(connectorReplyId)}
                onPressOut={onToggleLineCollapsePressOut}
                style={tw`absolute left-[${
                  i * 24 + 16
                }px] top-0 bottom-0 w-6 z-10`}
              >
                {({ pressed }) => (
                  <View
                    style={tw`absolute top-0 bottom-0 left-3 border-l border-solid border-[${
                      pressed
                        ? colors.foreground
                        : getLineColor(connectorReplyId)
                    }]`}
                  />
                )}
              </Pressable>
            ) : (
              <View
                key={`connector-${i}`}
                style={tw.style(
                  `absolute left-[${i * 24 + 28}px] top-0 bottom-0`,
                  `border-l border-solid border-[${getLineColor(
                    connectorReplyId
                  )}]`
                )}
              />
            )
          })}

          {replyLevel !== 0 && !reply.is_merged && (
            <>
              {parentLineReplyId !== undefined &&
              onToggleLineCollapse &&
              onToggleLineCollapsePressIn ? (
                <Pressable
                  onPress={() => onToggleLineCollapse(parentLineReplyId)}
                  onPressIn={() =>
                    onToggleLineCollapsePressIn(parentLineReplyId)
                  }
                  onPressOut={onToggleLineCollapsePressOut}
                  style={tw.style(
                    `absolute top-0 left-[${replyLevel * 24}px] w-8 z-10`,
                    `h-[${connectorTurnHeight}px]`
                  )}
                >
                  {({ pressed }) => (
                    <View
                      style={tw`border-[${
                        pressed
                          ? colors.foreground
                          : getLineColor(parentLineReplyId)
                      }] absolute top-0 left-1 border-0 border-b-[1px] w-6 border-l-[1px] h-[${connectorTurnHeight}px] rounded-bl-[12px]`}
                    />
                  )}
                </Pressable>
              ) : (
                <View
                  style={tw`border-[${getLineColor(
                    parentLineReplyId
                  )}] absolute top-0 left-[${
                    replyLevel * 24 + 4
                  }px] border-0 border-b-[1px] w-6 border-l-[1px] h-[${connectorTurnHeight}px] rounded-bl-[12px]`}
                />
              )}
            </>
          )}
        </>
      )}

      <View style={tw`flex-row ml-[${replyLevel * 24}px]`}>
        <View>
          {!showLegacyUi &&
            showNestedReply &&
            reply.is_merged &&
            replyLevel > 0 && (
              <View
                style={tw.style(
                  `border-l border-solid border-[${getLineColor(
                    parentLineReplyId
                  )}] absolute top-0 left-3 h-[${connectorTurnHeight}px]`
                )}
              />
            )}

          {((!collapsed &&
            (hasVisibleReplyChildren || shouldShowMergedContinuation)) ||
            (!showLegacyUi && !showNestedReply && !reply.is_last_reply)) && (
            <>
              {!showLegacyUi &&
              showNestedReply &&
              reply.reply_has_nested_children &&
              onToggleCollapse &&
              !collapsed ? (
                <Pressable
                  onPress={onToggleCollapse}
                  onPressIn={onToggleCollapsePressIn}
                  onPressOut={onToggleCollapsePressOut}
                  style={tw.style(
                    `absolute bottom-0 left-0 right-0 z-10`,
                    `top-6`
                  )}
                >
                  {({ pressed }) => (
                    <View
                      style={tw`border-l border-solid border-[${
                        pressed ? colors.foreground : ownLineColor
                      }] absolute top-0 bottom-0 left-3`}
                    />
                  )}
                </Pressable>
              ) : (
                <View
                  style={tw.style(
                    `border-l border-solid border-[${dividerColor}] absolute bottom-0 left-3`,
                    !showLegacyUi && showNestedReply ? `top-6` : `top-0`
                  )}
                />
              )}
            </>
          )}

          {!showLegacyUi &&
            showNestedReply &&
            reply.reply_has_nested_children &&
            onToggleCollapse &&
            !collapsed && (
              <Pressable
                onPress={onToggleCollapse}
                onPressIn={onToggleCollapsePressIn}
                onPressOut={onToggleCollapsePressOut}
                hitSlop={8}
                style={tw.style(
                  `absolute left-[4px] z-10 bg-[${itemBackgroundColor}] rounded-full`,
                  `bottom-[11px]`
                )}
              >
                <Feather
                  name="minus-circle"
                  size={16}
                  color={colors.foreground}
                />
              </Pressable>
            )}

          {collapsed && onToggleCollapse ? (
            <View style={tw`flex-row items-center gap-1`}>
              <Pressable
                onPress={onToggleCollapse}
                hitSlop={8}
                style={tw`w-6 h-6 items-center justify-center bg-[${itemBackgroundColor}] rounded-full z-10`}
              >
                <Feather
                  name="plus-circle"
                  size={16}
                  color={colors.foreground}
                />
              </Pressable>

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
          ) : (
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
          )}
        </View>
        <View style={tw.style(`flex-1`, !showLegacyUi && `pb-2`, `ml-2`)}>
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

          {!collapsed && (
            <>
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
                  source={replyHtmlSource}
                  inModalScreen={inModalScreen}
                  paddingX={32 + 28 + 24 * replyLevel}
                />
              </View>

              <View style={tw`flex-row items-center pt-2`}>
                <View style={tw`flex-row gap-4 mr-auto`}>
                  {isBoolean(related) && !related && (
                    <Text
                      style={tw`${fontSize.medium} text-[${colors.default}]`}
                    >
                      可能是无关内容
                    </Text>
                  )}
                  {!(isSelf(reply.member.username) && !reply.thanks) && (
                    <ThankReply topicId={topicId} once={once} reply={reply} />
                  )}

                  <Pressable
                    onPress={() => onReply(reply.member.username, reply.no)}
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

                  {showLegacyUi &&
                    reply.has_related_replies &&
                    !inModalScreen && (
                      <Pressable
                        onPress={() => {
                          navigation.navigate('RelatedReplies', {
                            replyId: reply.id,
                            topicId,
                            onReply: (username, replyNo) => {
                              navigation.goBack()
                              sleep(300).then(() => onReply(username, replyNo))
                            },
                          })
                        }}
                        style={tw`flex-row items-center`}
                      >
                        {({ pressed }) => (
                          <Fragment>
                            <IconButton
                              pressed={pressed}
                              color={colors.default}
                              activeColor={colors.foreground}
                              size={15}
                              icon={<FontAwesome5 name="comments" />}
                            />

                            <Text
                              style={tw`pl-1 ${fontSize.small} text-[${colors.default}]`}
                            >
                              查看评论
                            </Text>
                          </Fragment>
                        )}
                      </Pressable>
                    )}
                </View>

                <MoreButton once={once} reply={reply} topicId={topicId} />
              </View>
            </>
          )}
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
