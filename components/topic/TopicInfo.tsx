import { useActionSheet } from '@expo/react-native-action-sheet'
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import produce from 'immer'
import { compact } from 'lodash-es'
import { Fragment, ReactElement, memo } from 'react'
import { Pressable, Share, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

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
import { isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

import Html from '../Html'
import IconButton from '../IconButton'
import Separator from '../Separator'
import StyledImage from '../StyledImage'

export default memo(TopicInfo)

function TopicInfo({
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
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-tint-primary text-body-4 font-bold`}>
              {topic.member?.username}
            </Text>
          </View>

          <Separator style={tw`flex-1`}>
            {compact([
              topic.created && (
                <Text key="created" style={tw`text-tint-secondary text-body-5`}>
                  {dayjs(topic.created).fromNow()}
                  {topic.via ? ` via ${topic.via}` : ``}
                </Text>
              ),
              topic.views && (
                <Text
                  key="views"
                  style={tw`text-tint-secondary text-body-5 flex-1`}
                  numberOfLines={1}
                >
                  {`${topic.views} ??????`}
                </Text>
              ),
            ])}
          </Separator>
        </View>

        <MoreButton topic={topic} onAppend={onAppend} />
      </View>

      <Text style={tw`text-tint-primary text-body-3 font-bold pt-2`}>
        {topic.title}
      </Text>

      {!!topic.content && (
        <View style={tw`pt-2`}>
          <Html source={{ html: topic.content }} youtubePaddingX={32} />
        </View>
      )}

      {!!topic.supplements?.length && (
        <View style={tw`pt-2`}>
          {topic.supplements.map((supplement, i) => (
            <View
              key={supplement.created}
              style={tw`border-t border-solid border-tint-border py-2`}
            >
              <Separator>
                {[
                  <Text key="i" style={tw`text-tint-secondary text-body-5`}>
                    ???{i + 1}?????????
                  </Text>,
                  <Text
                    key="created"
                    style={tw`text-tint-secondary text-body-5`}
                  >
                    {supplement.created}
                  </Text>,
                ]}
              </Separator>

              <View style={tw`pt-1`}>
                <Html
                  source={{
                    html: supplement.content,
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
  const { mutateAsync, isLoading } = useLikeTopic()

  const navigation = useNavigation()

  return (
    <View style={tw.style(`flex-row items-center`)}>
      <IconButton
        color={tw`text-tint-secondary`.color as string}
        activeColor="rgb(250,219,20)"
        active={topic.liked}
        icon={<FontAwesome name={topic.liked ? 'star' : 'star-o'} />}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isLoading) return

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

            Toast.show({
              type: 'success',
              text1: '????????????',
            })
          } catch (error) {
            updateTopicDetail({
              id: topic.id,
              liked: topic.liked,
              likes: topic.likes,
            })

            Toast.show({
              type: 'error',
              text1: '????????????',
            })
          }
        }}
      />

      {!!topic.likes && (
        <Text
          style={tw.style(
            'text-body-6 pl-1',
            topic.liked ? `text-[rgb(250,219,20)]` : `text-tint-secondary`
          )}
        >
          {topic.likes}
        </Text>
      )}
    </View>
  )
}

export function ThankTopic({ topic }: { topic: Topic }) {
  const { mutateAsync, isLoading } = useThankTopic()

  const navigation = useNavigation()

  return (
    <View style={tw.style(`flex-row items-center`)}>
      <IconButton
        name={topic.thanked ? 'heart' : 'heart-outline'}
        color={tw`text-tint-secondary`.color as string}
        activeColor="rgb(249,24,128)"
        active={topic.thanked}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isLoading || topic.thanked) return

          await confirm('????????????????????????????????????????????????')

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
              text1: '????????????',
            })
          }
        }}
      />

      {!!topic.thanks && (
        <Text
          style={tw.style(
            'text-body-6 pl-1',
            topic.thanked ? `text-[rgb(249,24,128)]` : `text-tint-secondary`
          )}
        >
          {topic.thanks}
        </Text>
      )}
    </View>
  )
}

export function VoteButton({ topic }: { topic: Topic }) {
  const { mutateAsync, isLoading } = useVoteTopic()

  const navigation = useNavigation()

  return (
    <View
      style={tw`py-1 flex-row items-center border-tint-border border-solid border rounded-full`}
    >
      <Pressable
        style={tw`px-2 flex-row items-center`}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isLoading) return

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
              text1: '????????????',
            })
          }
        }}
      >
        {({ pressed }) => (
          <Fragment>
            <MaterialCommunityIcons
              name="thumb-up-outline"
              size={22.5}
              color={
                tw.style(pressed ? `text-[#ff4500]` : `text-tint-secondary`)
                  .color as string
              }
            />
            {!!topic.votes && (
              <Text style={tw.style(`ml-1 text-tint-secondary`)}>
                {topic.votes}
              </Text>
            )}
          </Fragment>
        )}
      </Pressable>

      <View style={tw`w-px h-3/4 border-tint-border border-l border-solid`} />

      <Pressable
        style={tw`px-2`}
        onPress={async () => {
          if (!isSignined()) {
            navigation.navigate('Login')
            return
          }

          if (isLoading) return

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
            color={
              tw.style(pressed ? `text-[#7193ff]` : `text-tint-secondary`)
                .color as string
            }
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
      color={tw`text-tint-secondary`.color as string}
      activeColor={tw`text-tint-primary`.color as string}
      onPress={() => {
        const options = compact([
          topic.ignored ? '????????????' : '??????',
          '??????',
          '??????',
          '???????????????',
          topic.editable && '??????',
          topic.appendable && '??????',
          '??????',
        ] as const)

        const destructiveButtonIndex = 0
        const cancelButtonIndex = options.indexOf('??????')

        showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
            userInterfaceStyle: store.get(colorSchemeAtom),
          },
          async selectedIndex => {
            switch (selectedIndex) {
              case 1:
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                if (reportTopicMutation.isLoading) return

                await confirm('?????????????????????????')

                try {
                  await reportTopicMutation.mutateAsync({
                    id: topic.id,
                    once: topic.once!,
                  })

                  Toast.show({
                    type: 'success',
                    text1: '????????????',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '????????????',
                  })
                }
                break

              case 2:
                Share.share({
                  title: topic.title,
                  url: `${baseURL}/t/${topic.id}`,
                })
                break

              case destructiveButtonIndex: {
                if (!isSignined()) {
                  navigation.navigate('Login')
                  return
                }

                if (ignoreTopicMutation.isLoading) return

                await confirm('?????????????????????????')

                try {
                  await ignoreTopicMutation.mutateAsync({
                    id: topic.id,
                    once: topic.once!,
                    type: topic.ignored ? 'unignore' : 'ignore',
                  })

                  navigation.goBack()

                  // refetch related queries
                  queryClient.refetchQueries(
                    useNodeTopics.getKey({ name: topic.node?.name })
                  )
                  const tab =
                    store.get(homeTabsAtom)?.[store.get(homeTabIndexAtom)!]?.key
                  if (tab === 'recent') {
                    queryClient.refetchQueries(useRecentTopics.getKey())
                  } else {
                    queryClient.refetchQueries(
                      useTabTopics.getKey({
                        tab,
                      })
                    )
                  }

                  Toast.show({
                    type: 'success',
                    text1: '????????????',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '????????????',
                  })
                }
                break
              }

              case options.indexOf('??????'):
                navigation.navigate('WriteTopic', { topic })
                break

              case options.indexOf('??????'):
                onAppend()
                break

              case options.indexOf('???????????????'):
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
