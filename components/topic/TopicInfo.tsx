import { useActionSheet } from '@expo/react-native-action-sheet'
import { AntDesign, MaterialIcons } from '@expo/vector-icons'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { compact } from 'lodash-es'
import { Fragment, ReactElement, useState } from 'react'
import {
  Platform,
  Pressable,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

import { v2exURL } from '@/jotai/baseUrlAtom'
import { blackListAtom } from '@/jotai/blackListAtom'
import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { homeTabIndexAtom, homeTabsAtom } from '@/jotai/homeTabsAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import { isSelf, isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import { isLargeTablet } from '@/utils/tablet'
import tw from '@/utils/tw'
import { getBaseURL } from '@/utils/url'

import Html from '../Html'
import IconButton from '../IconButton'
import Separator from '../Separator'
import StyledButton from '../StyledButton'
import StyledImage from '../StyledImage'

export default function TopicInfo({
  topic,
  children,
}: {
  topic: Topic
  children: ReactElement
}) {
  const [isParsing, setIsParsing] = useState(
    store.get(enabledParseContentAtom)!
  )

  const hasParsedText =
    !!topic.parsed_content || topic.supplements?.some(o => !!o.parsed_content)

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View
      style={tw`py-3 px-4 border-b border-solid border-[${colors.divider}]`}
    >
      <View style={tw`flex-row items-center`}>
        <View style={tw`mr-3`}>
          <Pressable
            onPress={() => {
              navigation.push('MemberDetail', {
                username: topic.member?.username!,
              })
            }}
          >
            <StyledImage
              style={tw`w-12 h-12 rounded-full`}
              source={topic.member?.avatar}
            />
          </Pressable>
        </View>

        <View style={tw`flex-1`}>
          <Separator style={tw`flex-nowrap`}>
            {compact([
              <Text
                key={'username'}
                style={tw`text-[${colors.foreground}] ${fontSize.xlarge} font-semibold flex-shrink`}
                numberOfLines={1}
              >
                {topic.member?.username}
              </Text>,
              hasParsedText && (
                <Text
                  key={'isParsing'}
                  style={tw`text-[${colors.default}] ${fontSize.small} mr-2`}
                  onPress={() => {
                    setIsParsing(!isParsing)
                  }}
                >
                  {isParsing ? `显示原始内容` : `隐藏原始内容`}
                </Text>
              ),
            ])}
          </Separator>

          <Separator style={tw`flex-1 flex-nowrap`}>
            {compact([
              topic.created && (
                <Text
                  key="created"
                  style={tw`text-[${colors.default}] ${fontSize.medium}`}
                >
                  {topic.created}
                </Text>
              ),
              topic.views && (
                <Text
                  key="views"
                  style={tw`text-[${colors.default}] ${fontSize.medium} flex-shrink`}
                  numberOfLines={1}
                >
                  {`${topic.views} 点击`}
                </Text>
              ),
            ])}
          </Separator>
        </View>

        <StyledButton
          type="tag"
          onPress={() => {
            if (isLargeTablet() && getCurrentRouteName() === 'NodeTopics') {
              navigation.replace('NodeTopics', { name: topic.node?.name! })
            } else {
              navigation.push('NodeTopics', { name: topic.node?.name! })
            }
          }}
        >
          {topic.node?.title}
        </StyledButton>
      </View>

      <Text
        style={tw`text-[${colors.foreground}] ${fontSize.xxlarge} font-medium pt-2`}
        selectable
      >
        {topic.title}
      </Text>

      {!!topic.content && (
        <View style={tw`pt-2`}>
          <Html
            source={{
              html:
                isParsing && topic.parsed_content
                  ? topic.parsed_content
                  : topic.content,
            }}
            paddingX={32}
          />
        </View>
      )}

      {!!topic.supplements?.length && (
        <View style={tw`pt-2`}>
          {topic.supplements.map((supplement, i) => (
            <View
              key={`${supplement.created}_${i}`}
              style={tw`border-t border-solid border-[${colors.divider}] py-2`}
            >
              <Separator>
                {[
                  <Text
                    key="i"
                    style={tw`text-[${colors.default}] ${fontSize.medium}`}
                  >
                    第{i + 1}条附言
                  </Text>,
                  <Text
                    key="created"
                    style={tw`text-[${colors.default}] ${fontSize.medium}`}
                  >
                    {supplement.created}
                  </Text>,
                ]}
              </Separator>

              <View style={tw`pt-1`}>
                <Html
                  source={{
                    html:
                      isParsing && supplement.parsed_content
                        ? supplement.parsed_content
                        : supplement.content,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {children}
    </View>
  )
}

export function LikeTopic({ topic }: { topic: Topic }) {
  const { isPending, mutateAsync } = k.topic.like.useMutation()

  const { colors } = useAtomValue(uiAtom)

  return (
    <Pressable
      style={tw.style(`flex-row items-center relative`)}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isPending) return

        try {
          updateTopicDetail({
            id: topic.id,
            liked: !topic.liked,
            likes: topic.likes + (topic.liked ? -1 : 1),
          })

          await mutateAsync({
            id: topic.id,
            type: topic.liked ? 'unfavorite' : 'favorite',
            once: topic.once!,
          })
        } catch (error) {
          updateTopicDetail({
            id: topic.id,
            liked: topic.liked,
            likes: topic.likes,
          })

          Toast.show({
            type: 'error',
            text1: error instanceof BizError ? error.message : '收藏失败',
          })
        }
      }}
    >
      {({ pressed }) => (
        <Fragment>
          <IconButton
            color={colors.default}
            activeColor="rgb(250,219,20)"
            active={topic.liked}
            icon={<AntDesign name={topic.liked ? 'star' : 'staro'} />}
            pressed={pressed}
            size={24}
          />

          {!!topic.likes && (
            <Text
              style={tw.style(
                `text-[10px] absolute -top-1 left-4 px-0.5  bg-[${colors.base100}] rounded-sm overflow-hidden`,
                topic.liked
                  ? `text-[rgb(250,219,20)]`
                  : `text-[${colors.default}]`
              )}
            >
              {topic.likes}
            </Text>
          )}
        </Fragment>
      )}
    </Pressable>
  )
}

export function ThankTopic({ topic }: { topic: Topic }) {
  const { mutateAsync, isPending } = k.topic.thank.useMutation()
  const { colors } = useAtomValue(uiAtom)

  return (
    <Pressable
      style={tw.style(`flex-row items-center relative`)}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isPending || topic.thanked) return

        await confirm('你确定要向本主题创建者发送谢意？')

        try {
          updateTopicDetail({
            id: topic.id,
            thanked: !topic.thanked,
            thanks: topic.thanks + 1,
          })

          await mutateAsync({
            id: topic.id,
            once: topic.once!,
          })
        } catch (error) {
          updateTopicDetail({
            id: topic.id,
            thanked: topic.thanked,
            thanks: topic.thanks,
          })

          Toast.show({
            type: 'error',
            text1: error instanceof BizError ? error.message : '感谢失败',
          })
        }
      }}
    >
      {({ pressed }) => (
        <Fragment>
          <IconButton
            name={topic.thanked ? 'heart' : 'heart-outline'}
            color={colors.default}
            activeColor={colors.danger}
            active={topic.thanked}
            pressed={pressed}
            size={24}
          />

          {!!topic.thanks && (
            <Text
              style={tw.style(
                `text-[10px] absolute -top-1 left-4 px-0.5 bg-[${colors.base100}] rounded-sm overflow-hidden`,
                topic.thanked
                  ? `text-[${colors.danger}]`
                  : `text-[${colors.default}]`
              )}
            >
              {topic.thanks}
            </Text>
          )}
        </Fragment>
      )}
    </Pressable>
  )
}

export function VoteButton({ topic }: { topic: Topic }) {
  const { mutateAsync, isPending } = k.topic.vote.useMutation()

  const { colors } = useAtomValue(uiAtom)

  return (
    <View
      style={tw`p-2 flex-row items-center rounded-full bg-[${colors.primary}] bg-opacity-10`}
    >
      <TouchableOpacity
        style={tw`px-2 flex-row items-center`}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isPending) return

          try {
            const newVotes = await mutateAsync({
              id: topic.id,
              type: 'up',
              once: topic.once!,
            })

            updateTopicDetail({
              id: topic.id,
              votes: newVotes,
            })
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: error instanceof BizError ? error.message : '点赞失败',
            })
          }
        }}
      >
        <MaterialIcons
          name="thumb-up-off-alt"
          size={22.5}
          color={colors.primary}
        />

        <Text style={tw.style(`ml-1 text-[${colors.primary}]`)}>
          {topic.votes ? topic.votes : '赞同'}
        </Text>
      </TouchableOpacity>

      <View
        style={tw`border-l border-[${colors.primary}] border-opacity-20 border-solid w-1 h-5`}
      />

      <TouchableOpacity
        style={tw`px-2`}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isPending) return

          try {
            const newVotes = await mutateAsync({
              id: topic.id,
              type: 'down',
              once: topic.once!,
            })

            updateTopicDetail({
              id: topic.id,
              votes: newVotes,
            })
          } catch (error) {
            // empty
          }
        }}
      >
        <MaterialIcons
          name="thumb-down-off-alt"
          size={22.5}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  )
}

export function MoreButton({
  topic,
  onAppend,
}: {
  topic: Topic
  onAppend: () => void
}) {
  const { showActionSheetWithOptions } = useActionSheet()

  const ignoreTopicMutation = k.topic.ignore.useMutation()

  const reportTopicMutation = k.topic.report.useMutation()

  const { colors } = useAtomValue(uiAtom)

  return (
    <IconButton
      name="dots-horizontal"
      color={colors.default}
      activeColor={colors.foreground}
      onPress={() => {
        const options = compact([
          !isSelf(topic.member?.username) &&
            (topic.ignored ? '取消忽略' : '忽略'),
          !isSelf(topic.member?.username) && '举报',
          '分享',
          topic.editable && '编辑',
          topic.appendable && '附言',
          'Webview 打开',
          '取消',
        ] as const)

        const destructiveButtonIndex = options.findIndex(o =>
          o.includes('忽略')
        )
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
              case options.indexOf('举报'):
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                if (reportTopicMutation.isPending) return

                await confirm('确定举报该主题么?')

                try {
                  await reportTopicMutation.mutateAsync({
                    id: topic.id,
                    once: topic.once!,
                  })

                  Toast.show({
                    type: 'success',
                    text1: '举报成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1:
                      error instanceof BizError ? error.message : '举报失败',
                  })
                }
                break

              case options.indexOf('分享'):
                Share.share(
                  Platform.OS === 'android'
                    ? {
                        title: topic.title,
                        message: `${v2exURL}/t/${topic.id}`,
                      }
                    : {
                        title: topic.title,
                        url: `${v2exURL}/t/${topic.id}`,
                      }
                )
                break

              case destructiveButtonIndex: {
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                if (ignoreTopicMutation.isPending) return

                if (!topic.ignored) await confirm(`确定忽略该主题么?`)

                try {
                  await ignoreTopicMutation.mutateAsync({
                    id: topic.id,
                    once: topic.once!,
                    type: topic.ignored ? 'unignore' : 'ignore',
                  })

                  navigation.goBack()

                  // refetch related queries
                  queryClient.refetchQueries(
                    k.node.topics.getFetchOptions({
                      name: topic.node?.name!,
                    })
                  )
                  const tab =
                    store.get(homeTabsAtom)?.[store.get(homeTabIndexAtom)!]?.key
                  if (tab === 'recent') {
                    queryClient.refetchQueries({
                      queryKey: k.topic.recent.getKey(),
                      type: 'active',
                    })
                  } else {
                    queryClient.refetchQueries({
                      queryKey: k.topic.tab.getKey({
                        tab,
                      }),
                      type: 'active',
                    })
                  }

                  // set black list atom
                  if (topic.ignored) {
                    store.set(blackListAtom, prev => ({
                      ...prev,
                      ignoredTopics: prev.blockers.filter(o => o === topic.id),
                    }))
                  } else {
                    store.set(blackListAtom, prev => ({
                      ...prev,
                      ignoredTopics: [
                        ...new Set([...prev.ignoredTopics, topic.id]),
                      ],
                    }))
                  }

                  Toast.show({
                    type: 'success',
                    text1: topic.ignored ? '取消忽略成功' : '忽略成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1:
                      error instanceof BizError ? error.message : '忽略失败',
                  })
                }
                break
              }

              case options.indexOf('编辑'):
                navigation.navigate('WriteTopic', { topic })
                break

              case options.indexOf('附言'):
                onAppend()
                break

              case options.indexOf('Webview 打开'):
                navigation.navigate('Webview', {
                  url: `${getBaseURL()}/t/${topic.id}`,
                })
                break

              case cancelButtonIndex:
              // Canceled
            }
          }
        )
      }}
    />
  )
}

function updateTopicDetail(newTopic: Partial<Topic>) {
  queryClient.setQueryData(
    k.topic.detail.getKey({ id: newTopic.id! }),
    produce<inferData<typeof k.topic.detail>>(data => {
      data?.pages.forEach(topic => {
        Object.assign(topic, newTopic)
      })
    })
  )
}
