import { Octicons } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { last, uniqBy } from 'lodash-es'
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native'

import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import ReplyBox, { ReplyBoxRef } from '@/components/topic/ReplyBox'
import ReplyItem from '@/components/topic/ReplyItem'
import TopicInfo, {
  LikeTopic,
  ThankTopic,
  VoteButton,
} from '@/components/topic/TopicInfo'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isMe } from '@/utils/authentication'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(TopicDetailScreen, {
  Loading: () => (
    <TopicDetailPlaceholder>
      <LoadingIndicator />
    </TopicDetailPlaceholder>
  ),
  fallbackRender: props => (
    <TopicDetailPlaceholder>
      <FallbackComponent {...props} />
    </TopicDetailPlaceholder>
  ),
})

function TopicDetailPlaceholder({ children }: { children?: ReactNode }) {
  const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()
  return (
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar title="帖子" />
      {params.member && (
        <View style={tw`pt-3 px-4`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`mr-3`}>
              <StyledImage
                style={tw`w-12 h-12 rounded-full`}
                source={{
                  uri: params.member?.avatar,
                }}
              />
            </View>

            <View style={tw`flex-1`}>
              <Text style={tw`text-tint-primary ${getFontSize(4)} font-bold`}>
                {params.member?.username}
              </Text>

              <Text
                key="reply_count"
                style={tw`text-tint-secondary ${getFontSize(
                  5
                )} flex-1 min-h-[24px]`}
                numberOfLines={1}
              >
                {`${params.reply_count} 回复`}
              </Text>
            </View>
          </View>
          <Text style={tw`text-tint-primary ${getFontSize(3)} font-bold pt-2`}>
            {params.title}
          </Text>
        </View>
      )}
      {children}
    </View>
  )
}

type OrderBy = 'asc' | 'desc'

function TopicDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'TopicDetail'>>()

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useTopicDetail({
      variables: { id: params.id },
      enabled: !!params.id,
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const topic = last(data?.pages)!

  const replyBoxRef = useRef<ReplyBoxRef>(null)

  const handleReplyItem = useCallback((username: string) => {
    replyBoxRef.current?.replyFor({ username })
  }, [])

  const [orderBy, setOrderBy] = useState<OrderBy>('asc')

  useEffect(() => {
    // fetch all pages when order equals to `desc`
    if (orderBy === 'desc' && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [orderBy, hasNextPage, fetchNextPage, isFetchingNextPage])

  const flatedData = useMemo(() => {
    const result = uniqBy(
      data?.pages.map(page => page.replies).flat() || [],
      'id'
    )
    if (orderBy === 'desc') result.reverse()
    return result
  }, [data?.pages, orderBy])

  const renderItem: ListRenderItem<Reply> = useCallback(
    ({ item }) => (
      <ReplyItem
        key={item.id}
        reply={item as Reply}
        topicId={topic.id}
        once={topic.once}
        hightlight={
          params.hightlightReplyNo
            ? params.hightlightReplyNo === item.no
            : undefined
        }
        onReply={handleReplyItem}
      />
    ),
    [topic.id, topic.once, params.hightlightReplyNo, handleReplyItem]
  )

  const [avatarVisible, setAvatarVisible] = useState(true)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1 bg-body-1`}>
      <FlatList
        key={colorScheme}
        data={flatedData}
        removeClippedSubviews={Platform.OS === 'android' ? false : undefined}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            progressViewOffset={navbarHeight}
          />
        }
        renderItem={renderItem}
        ItemSeparatorComponent={LineSeparator}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <TopicInfo
            topic={topic}
            onAppend={() => {
              replyBoxRef.current?.replyFor({ isAppend: true })
            }}
          >
            <View
              style={tw.style(`flex-row items-center justify-between pt-2`)}
            >
              <View style={tw`flex-1 flex-row justify-between items-center`}>
                <VoteButton topic={topic} />

                <Pressable
                  style={tw.style(`flex-row items-center`)}
                  onPress={() => {
                    replyBoxRef.current?.replyFor()
                  }}
                >
                  {({ pressed }) => (
                    <Fragment>
                      <IconButton
                        color={tw.color(`text-tint-secondary`)}
                        activeColor="rgb(29,155,240)"
                        size={21}
                        icon={<Octicons name="comment" />}
                        pressed={pressed}
                      />

                      {!!topic.reply_count && (
                        <Text
                          style={tw.style(
                            `${getFontSize(6)} pl-1 text-tint-secondary`
                          )}
                        >
                          {topic.reply_count}
                        </Text>
                      )}
                    </Fragment>
                  )}
                </Pressable>

                {!isMe(topic.member?.username) && <ThankTopic topic={topic} />}

                <LikeTopic topic={topic} />
              </View>

              <View style={tw`flex-shrink-0 w-8`} />

              <RadioButtonGroup
                options={
                  [
                    { label: '默认', value: 'asc' },
                    { label: '最新', value: 'desc' },
                  ] as {
                    label: string
                    value: OrderBy
                  }[]
                }
                value={orderBy}
                onChange={setOrderBy}
              />
            </View>
          </TopicInfo>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null
        }
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-16`}>
            <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
              目前还没有回复
            </Text>
          </View>
        }
        onScroll={ev => {
          setAvatarVisible(ev.nativeEvent.contentOffset.y <= 64)
        }}
      />

      <ReplyBox
        onSuccess={refetch}
        once={topic.once}
        topicId={params.id}
        ref={replyBoxRef}
      />

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="帖子">
          {!avatarVisible && (
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text
                  style={tw`text-tint-primary ${getFontSize(
                    4
                  )} font-bold w-4/5`}
                  numberOfLines={1}
                >
                  {topic.title}
                </Text>
              </View>

              <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
                {topic.reply_count} 条回复
              </Text>
            </View>
          )}
        </NavBar>
      </View>
    </View>
  )
}
