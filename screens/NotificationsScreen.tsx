import { Feather } from '@expo/vector-icons'
import produce from 'immer'
import { useAtomValue } from 'jotai'
import { findIndex, uniqBy } from 'lodash-es'
import { useMutation, useSuspenseQuery } from 'quaere'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import DebouncedPressable from '@/components/DebouncedPressable'
import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RefetchingIndicator from '@/components/RefetchingIndicator'
import Separator, { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import ReplyBox, { ReplyInfo } from '@/components/topic/ReplyBox'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { deleteNoticeMutation, notificationsQuery } from '@/servicies/notice'
import { Notice } from '@/servicies/types'
import { isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient, useRemoveUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(NotificationsScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="未读提醒" />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="未读提醒" />
      <FallbackComponent {...props} />
    </View>
  ),
})

function NotificationsScreen() {
  useRemoveUnnecessaryPages({
    query: notificationsQuery,
  })

  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useSuspenseQuery({
    query: notificationsQuery,
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const [replyInfo, setReplyInfo] = useState<ReplyInfo | null>(null)

  const profile = useAtomValue(profileAtom)

  const renderItem: ListRenderItem<Notice> = useCallback(
    ({ item }) => (
      <NoticeItem
        key={item.id}
        notice={item}
        onReply={notice => {
          setReplyInfo({
            topicId: notice.topic.id,
            username: notice.member.username,
          })
        }}
      />
    ),
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      <RefetchingIndicator
        isRefetching={isFetching && !isRefetchingByUser}
        progressViewOffset={navbarHeight}
      >
        <FlatList
          key={colorScheme}
          data={flatedData}
          refreshControl={
            <StyledRefreshControl
              refreshing={isRefetchingByUser}
              onRefresh={refetchByUser}
              progressViewOffset={navbarHeight}
            />
          }
          contentContainerStyle={{
            paddingTop: navbarHeight,
          }}
          ItemSeparatorComponent={LineSeparator}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <SafeAreaView edges={['bottom']}>
              {isFetchingNextPage ? (
                <StyledActivityIndicator style={tw`py-4`} />
              ) : null}
            </SafeAreaView>
          }
        />
      </RefetchingIndicator>

      {replyInfo && (
        <ReplyBox
          onSuccess={() => {
            refetch()
            setReplyInfo(null)
          }}
          replyInfo={replyInfo}
          onCancel={() => {
            setReplyInfo(null)
          }}
          once={profile?.once}
        />
      )}

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="未读提醒" />
      </View>
    </View>
  )
}

const NoticeItem = memo(
  ({
    notice,
    onReply,
  }: {
    notice: Notice
    onReply: (notice: Notice) => void
  }) => {
    return (
      <DebouncedPressable
        style={tw`flex-row flex-wrap p-4`}
        onPress={() => {
          navigation.push('TopicDetail', {
            ...notice.topic,
            hightlightReplyNo: [
              notice.prev_action_text,
              notice.next_action_text,
            ].some(text => text?.includes('回复'))
              ? notice.topic.reply_count
              : undefined,
          })
        }}
      >
        <Pressable
          onPress={() => {
            navigation.navigate('MemberDetail', {
              username: notice.member?.username!,
            })
          }}
        >
          <StyledImage
            style={tw`w-6 h-6 mr-3 rounded-full`}
            source={{
              uri: notice.member.avatar,
            }}
          />
        </Pressable>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Separator style={tw`mr-auto`}>
              <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
                {notice.member.username}
              </Text>
              <Text style={tw`text-tint-secondary ${getFontSize(5)}`}>
                {notice.created}
              </Text>
            </Separator>

            {!!notice.content &&
              !notice.prev_action_text.includes('感谢了你') && (
                <IconButton
                  style={tw`mr-2`}
                  color={tw.color(`text-tint-secondary`)}
                  activeColor="rgb(29,155,240)"
                  size={15}
                  icon={<Feather name="message-circle" />}
                  onPress={() => onReply(notice)}
                />
              )}

            <DeleteNoticeButton id={notice.id} once={notice.once} />
          </View>

          <Text
            style={tw`flex-row flex-wrap ${getFontSize(5)} text-tint-secondary`}
          >
            {notice.prev_action_text}
            <Text style={tw`text-tint-primary`}>{notice.topic.title}</Text>
            {notice.next_action_text}
          </Text>

          {!!notice.content && (
            <View
              style={tw`bg-[#f0f3f5] dark:bg-[#262626] px-4 py-3 mt-2 rounded`}
            >
              <Html
                source={{ html: notice.content }}
                defaultTextProps={{ selectable: false }}
              />
            </View>
          )}
        </View>
      </DebouncedPressable>
    )
  },
  (prev, next) => prev.notice.created === next.notice.created
)

function DeleteNoticeButton({ id, once }: { id: number; once: string }) {
  const { trigger, isMutating } = useMutation({
    mutation: deleteNoticeMutation,
  })

  return (
    <IconButton
      size={16}
      name="delete-outline"
      color={tw.color(`text-tint-secondary`)}
      activeColor={tw.color(`text-tint-primary`)}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isMutating) return

        await confirm(`确认删除这条提醒么？`)

        const notifications = queryClient.getQueryData({
          query: notificationsQuery,
        })

        try {
          queryClient.setQueryData(
            {
              query: notificationsQuery,
            },
            produce(draft => {
              for (const page of draft?.pages || []) {
                const index = findIndex(page.list, { id })
                if (index > -1) {
                  page.list.splice(index, 1)
                  break
                }
              }
            })
          )

          await trigger({
            id,
            once,
          })
        } catch (error) {
          queryClient.setQueryData({ query: notificationsQuery }, notifications)
          Toast.show({
            type: 'error',
            text1: '删除失败',
          })
        }
      }}
    />
  )
}
