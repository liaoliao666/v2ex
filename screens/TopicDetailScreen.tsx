import { Octicons } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { last, uniqBy } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'

import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import ReplyBox, { ReplyBoxRef } from '@/components/topic/ReplyBox'
import ReplyItem from '@/components/topic/ReplyItem'
import TopicInfo, {
  LikeTopic,
  ThankTopic,
  VoteButton,
} from '@/components/topic/TopicInfo'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(TopicDetailScreen, {
  Loading: () => (
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar title="帖子" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="帖子" />
      <FallbackComponent {...props} />
    </View>
  ),
})

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

  const lastPage = last(data?.pages)!

  const replyBoxRef = useRef<ReplyBoxRef>(null)

  const handleReplyItem = useCallback((username: string) => {
    replyBoxRef.current?.replyFor({ username })
  }, [])

  const handleAppend = useCallback(() => {
    replyBoxRef.current?.replyFor({ isAppend: true })
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
        topicId={lastPage.id}
        once={lastPage.once}
        hightlight={
          params.hightlightReplyNo
            ? params.hightlightReplyNo === item.no
            : undefined
        }
        onReply={handleReplyItem}
      />
    ),
    [lastPage.id, lastPage.once, params.hightlightReplyNo, handleReplyItem]
  )

  const [avatarVisible, setAvatarVisible] = useState(true)

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar title="帖子">
        {!avatarVisible && (
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-tint-primary text-body-4 font-bold`}>
                {lastPage.member?.username}
              </Text>
            </View>

            <Text style={tw`text-tint-secondary text-body-6`}>
              {lastPage.reply_count} 条回复
            </Text>
          </View>
        )}
      </NavBar>

      <FlatList
        removeClippedSubviews
        key={colorScheme}
        data={flatedData}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
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
          <TopicInfo topic={lastPage} onAppend={handleAppend}>
            <View
              style={tw.style(`flex-row items-center justify-between pt-2`)}
            >
              <View style={tw`flex-1 flex-row justify-between items-center`}>
                <VoteButton topic={lastPage} />

                <View style={tw.style(`flex-row items-center`)}>
                  <IconButton
                    color={tw`text-tint-secondary`.color as string}
                    activeColor="rgb(245,158,11)"
                    onPress={() => {
                      replyBoxRef.current?.replyFor()
                    }}
                    size={21}
                    icon={<Octicons name="comment" />}
                  />

                  {!!lastPage.reply_count && (
                    <Text
                      style={tw.style('text-body-6 pl-1 text-tint-secondary')}
                    >
                      {lastPage.reply_count}
                    </Text>
                  )}
                </View>

                <ThankTopic topic={lastPage} />

                <LikeTopic topic={lastPage} />
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
            <Text style={tw`text-tint-secondary text-body-6`}>
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
        once={lastPage.once}
        topicId={params.id}
        ref={replyBoxRef}
      />
    </View>
  )
}
