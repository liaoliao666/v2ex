import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { last, uniqBy } from 'lodash-es'
import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import ReplyBox, { ReplyBoxRef } from '@/components/topic/ReplyBox'
import ReplyItem from '@/components/topic/ReplyItem'
import TopicInfo from '@/components/topic/TopicInfo'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { sleep } from '@/utils/sleep'
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
    replyBoxRef.current?.replyFor(username)
  }, [])

  const renderItem: ListRenderItem<Reply> = useCallback(
    ({ item, index }) => (
      <ReplyItem
        key={item.id}
        reply={item as Reply}
        topicId={lastPage.id}
        once={lastPage.once}
        hightlight={index === params.initialScrollIndex}
        index={index}
        onReply={handleReplyItem}
      />
    ),
    [lastPage.id, lastPage.once, params.initialScrollIndex, handleReplyItem]
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.replies).flat(), 'id'),
    [data?.pages]
  )

  const [avatarVisible, setAvatarVisible] = useState(true)

  const flatList = useRef<FlatList>(null)

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
        key={colorScheme}
        ref={flatList}
        data={flatedData}
        initialScrollIndex={
          params.initialScrollIndex != null &&
          params.initialScrollIndex < flatedData.length
            ? params.initialScrollIndex
            : undefined
        }
        onScrollToIndexFailed={info => {
          sleep(500).then(() => {
            flatList.current?.scrollToIndex({
              index: info.index,
              animated: true,
            })
          })
        }}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
          />
        }
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <TopicInfo
            topic={lastPage}
            onReply={useCallback(() => {
              replyBoxRef.current?.replyFor()
            }, [])}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null
        }
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-16`}>
            <Text style={tw`text-tint-secondary text-body-6`}>
              目前还没有未读提醒
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
