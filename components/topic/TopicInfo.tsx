import { useActionSheet } from '@expo/react-native-action-sheet'
import {
  FontAwesome,
  MaterialCommunityIcons,
  Octicons,
} from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import produce from 'immer'
import { compact } from 'lodash-es'
import { Fragment, memo } from 'react'
import { Alert, Pressable, Share, Text, View } from 'react-native'
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
import { validateLoginStatus } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { baseURL } from '@/utils/request/baseURL'
import tw from '@/utils/tw'

import Html from '../Html'
import IconButton from '../IconButton'
import Separator from '../Separator'
import Space from '../Space'
import StyledImage from '../StyledImage'

export default memo(TopicInfo)

function TopicInfo({ topic, onReply }: { topic: Topic; onReply: () => void }) {
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
                  {`${topic.views} 点击`}
                </Text>
              ),
            ])}
          </Separator>
        </View>
      </View>

      <Text style={tw`text-tint-primary text-body-4 font-bold pt-2`}>
        {topic.title}
      </Text>

      {!!topic.content && (
        <View style={tw`pt-2`}>
          <Html source={{ html: topic.content }} />
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
                    第{i + 1}条附言
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

      <View style={tw.style(`flex-row items-center justify-between pt-2`)}>
        <VoteButton topic={topic} />

        <Space style={tw`ml-4 mr-auto items-center`}>
          <View style={tw.style(`flex-row items-center`)}>
            <IconButton
              color={tw`text-tint-secondary`.color as string}
              activeColor="rgb(245,158,11)"
              onPress={onReply}
              size={21}
              icon={<Octicons name="comment" />}
            />

            {!!topic.reply_count && (
              <Text style={tw.style('text-body-6 pl-1 text-tint-secondary')}>
                {topic.reply_count}
              </Text>
            )}
          </View>

          <ThankTopic topic={topic} />

          <LikeTopic topic={topic} />
        </Space>

        <MoreButton topic={topic} />
      </View>
    </View>
  )
}

function LikeTopic({ topic }: { topic: Topic }) {
  const { mutateAsync, isLoading } = useLikeTopic()

  return (
    <View style={tw.style(`flex-row items-center`)}>
      <IconButton
        color={tw`text-tint-secondary`.color as string}
        activeColor="rgb(250,219,20)"
        active={topic.liked}
        icon={<FontAwesome name={topic.liked ? 'star' : 'star-o'} />}
        onPress={async () => {
          validateLoginStatus()

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
              text1: '操作成功',
            })
          } catch (error) {
            updateTopicDetail({
              id: topic.id,
              liked: topic.liked,
              likes: topic.likes,
            })

            Toast.show({
              type: 'error',
              text1: '操作失败',
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

function ThankTopic({ topic }: { topic: Topic }) {
  const { mutateAsync, isLoading } = useThankTopic()

  return (
    <View style={tw.style(`flex-row items-center`)}>
      <IconButton
        name={topic.thanked ? 'heart' : 'heart-outline'}
        color={tw`text-tint-secondary`.color as string}
        activeColor="rgb(249,24,128)"
        active={topic.thanked}
        onPress={async () => {
          validateLoginStatus()

          if (isLoading || topic.thanked) return

          await new Promise((resolve, reject) =>
            Alert.alert(
              '你确定要向本主题创建者发送谢意？',
              '',
              [
                {
                  text: '取消',
                  onPress: reject,
                  style: 'cancel',
                },
                {
                  text: '确定',
                  onPress: resolve,
                },
              ],
              {
                userInterfaceStyle: store.get(colorSchemeAtom),
              }
            )
          )

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

function VoteButton({ topic }: { topic: Topic }) {
  const { mutateAsync, isLoading } = useVoteTopic()

  return (
    <View style={tw`py-1 flex-row items-center`}>
      <Pressable
        style={tw`px-1 flex-row items-center`}
        onPress={async () => {
          validateLoginStatus()

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
        style={tw`px-1`}
        onPress={async () => {
          validateLoginStatus()

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

function MoreButton({ topic }: { topic: Topic }) {
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
        const options = [
          topic.ignored ? '取消忽略' : '忽略',
          '举报',
          '分享',
          '取消',
        ]
        const destructiveButtonIndex = 0
        const cancelButtonIndex = 3

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
                validateLoginStatus()

                if (reportTopicMutation.isLoading) return

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

              case 2:
                Share.share({
                  title: topic.title,
                  url: `${baseURL}/t/${topic.id}`,
                })
                break

              case destructiveButtonIndex: {
                validateLoginStatus()

                if (ignoreTopicMutation.isLoading) return

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
                    text1: '操作成功',
                  })
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '操作失败',
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
