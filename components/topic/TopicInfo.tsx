import { useActionSheet } from '@expo/react-native-action-sheet'
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import produce from 'immer'
import { compact } from 'lodash-es'
import { Fragment, ReactElement, useState } from 'react'
import { Platform, Pressable, Share, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

import { blackListAtom } from '@/jotai/blackListAtom'
import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { homeTabIndexAtom, homeTabsAtom } from '@/jotai/homeTabsAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useNodeTopics } from '@/servicies/node'
import {
  useIgnoreTopic,
  useLikeTopic,
  useRecentTopics,
  useReportTopic,
  useTabTopics,
  useThankTopic,
  useTopicDetail,
  useVoteTopic,
} from '@/servicies/topic'
import { Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isMe, isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

import Html from '../Html'
import IconButton from '../IconButton'
import Separator from '../Separator'
import StyledImage from '../StyledImage'

export default function TopicInfo({
  topic,
  onAppend,
  children,
}: {
  topic: Topic
  onAppend: () => void
  children: ReactElement
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [isParsing, setIsParsing] = useState(
    store.get(enabledParseContentAtom)!
  )

  const hasParsedText =
    !!topic.parsed_content || topic.supplements?.some(o => !!o.parsed_content)

  return (
    <View style={tw`py-3 px-4 border-b border-solid border-tint-border`}>
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
              source={{
                uri: topic.member?.avatar,
              }}
            />
          </Pressable>
        </View>

        <View style={tw`flex-1`}>
          <Separator style={tw`flex-nowrap`}>
            {compact([
              <Text
                key={'username'}
                style={tw`text-tint-primary ${getFontSize(
                  4
                )} font-semibold flex-shrink`}
                numberOfLines={1}
              >
                {topic.member?.username}
              </Text>,
              hasParsedText && (
                <Text
                  key={'isParsing'}
                  style={tw`text-tint-secondary ${getFontSize(6)} mr-2`}
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
                  style={tw`text-tint-secondary ${getFontSize(5)}`}
                >
                  {topic.created}
                </Text>
              ),
              topic.views && (
                <Text
                  key="views"
                  style={tw`text-tint-secondary ${getFontSize(5)} flex-shrink`}
                  numberOfLines={1}
                >
                  {`${topic.views} 点击`}
                </Text>
              ),
            ])}
          </Separator>
        </View>

        <MoreButton topic={topic} onAppend={onAppend} />
      </View>

      <Text
        style={tw`text-tint-primary ${getFontSize(3)} font-medium pt-2`}
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
              style={tw`border-t border-solid border-tint-border py-2`}
            >
              <Separator>
                {[
                  <Text
                    key="i"
                    style={tw`text-tint-secondary ${getFontSize(5)}`}
                  >
                    第{i + 1}条附言
                  </Text>,
                  <Text
                    key="created"
                    style={tw`text-tint-secondary ${getFontSize(5)}`}
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
  const { mutateAsync, isPending } = useLikeTopic()

  const navigation = useNavigation()

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
            text1: '收藏失败',
          })
        }
      }}
    >
      {({ pressed }) => (
        <Fragment>
          <IconButton
            color={tw.color(`text-tint-secondary`)}
            activeColor="rgb(250,219,20)"
            active={topic.liked}
            icon={<AntDesign name={topic.liked ? 'star' : 'staro'} />}
            pressed={pressed}
            size={24}
          />

          {!!topic.likes && (
            <Text
              style={tw.style(
                `text-[10px] absolute -top-1 left-4 px-0.5  bg-body-1`,
                topic.liked ? `text-[rgb(250,219,20)]` : `text-tint-secondary`
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
  const { mutateAsync, isPending } = useThankTopic()

  const navigation = useNavigation()

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
            text1: '感谢失败',
          })
        }
      }}
    >
      {({ pressed }) => (
        <Fragment>
          <IconButton
            name={topic.thanked ? 'heart' : 'heart-outline'}
            color={tw.color(`text-tint-secondary`)}
            activeColor="rgb(249,24,128)"
            active={topic.thanked}
            pressed={pressed}
            size={24}
          />

          {!!topic.thanks && (
            <Text
              style={tw.style(
                `text-[10px] absolute -top-1 left-4 px-0.5 bg-body-1`,
                topic.thanked ? `text-[rgb(249,24,128)]` : `text-tint-secondary`
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
  const { mutateAsync, isPending } = useVoteTopic()

  const navigation = useNavigation()

  return (
    <View style={tw`p-2 flex-row items-center rounded-full bg-input`}>
      <Pressable
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
              text1: '点赞失败',
            })
          }
        }}
      >
        {({ pressed }) => (
          <Fragment>
            <MaterialCommunityIcons
              name="thumb-up-outline"
              size={22.5}
              color={tw.color(
                pressed ? `text-[#ff4500]` : `text-tint-secondary`
              )}
            />

            <Text style={tw.style(`ml-1 text-tint-secondary`)}>
              {topic.votes ? topic.votes : '赞同'}
            </Text>
          </Fragment>
        )}
      </Pressable>

      <Pressable
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
        {({ pressed }) => (
          <MaterialCommunityIcons
            name="thumb-down-outline"
            size={22.5}
            color={tw.color(pressed ? `text-[#7193ff]` : `text-tint-secondary`)}
          />
        )}
      </Pressable>
    </View>
  )
}

function MoreButton({
  topic,
  onAppend,
}: {
  topic: Topic
  onAppend: () => void
}) {
  const { showActionSheetWithOptions } = useActionSheet()

  const navigation = useNavigation()

  const ignoreTopicMutation = useIgnoreTopic()

  const reportTopicMutation = useReportTopic()

  return (
    <IconButton
      name="dots-horizontal"
      color={tw.color(`text-tint-secondary`)}
      activeColor={tw.color(`text-tint-primary`)}
      onPress={() => {
        const options = compact([
          !isMe(topic.member?.username) &&
            (topic.ignored ? '取消忽略' : '忽略'),
          !isMe(topic.member?.username) && '举报',
          '分享',
          topic.editable && '编辑',
          topic.appendable && '附言',
          '浏览器打开',
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
                    text1: '举报失败',
                  })
                }
                break

              case options.indexOf('分享'):
                Share.share(
                  Platform.OS === 'android'
                    ? {
                        title: topic.title,
                        message: `${baseURL}/t/${topic.id}`,
                      }
                    : {
                        title: topic.title,
                        url: `${baseURL}/t/${topic.id}`,
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
                  queryClient.refetchQueries({
                    queryKey: useNodeTopics.getKey({ name: topic.node?.name }),
                  })
                  const tab =
                    store.get(homeTabsAtom)?.[store.get(homeTabIndexAtom)!]?.key
                  if (tab === 'recent') {
                    queryClient.refetchQueries({
                      queryKey: useRecentTopics.getKey(),
                      type: 'active',
                    })
                  } else {
                    queryClient.refetchQueries({
                      queryKey: useTabTopics.getKey({
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
                  queryClient.refetchQueries({
                    queryKey: useIgnoreTopic.getKey(),
                    type: 'active',
                  })

                  Toast.show({
                    type: 'success',
                    text1: '忽略成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '忽略失败',
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

              case options.indexOf('浏览器打开'):
                openURL(`${baseURL}/t/${topic.id}`)
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
  queryClient.setQueryData<inferData<typeof useTopicDetail>>(
    useTopicDetail.getKey({ id: newTopic.id }),
    produce(data => {
      data?.pages.forEach(topic => {
        Object.assign(topic, newTopic)
      })
    })
  )
}
