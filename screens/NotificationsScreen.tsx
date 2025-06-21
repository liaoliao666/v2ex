import Feather from 'react-native-vector-icons/Feather'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { findIndex, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

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
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Notice, k } from '@/servicies'
import { isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
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
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isFetching } =
    k.notification.list.useSuspenseInfiniteQuery()

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(() =>
    queryClient.prefetchInfiniteQuery({
      ...k.notification.list.getFetchOptions(),
      pages: 1,
    })
  )

  const [replyInfo, setReplyInfo] = useState<ReplyInfo | null>(null)

  const profile = useAtomValue(profileAtom)

  const renderItem: ListRenderItem<Notice> = useCallback(
    ({ item }) => (
      <NoticeItem
        key={item.id}
        notice={item}
        onReply={() => {
          setReplyInfo({
            topicId: item.topic.id,
            username: item.member.username,
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
  ({ notice, onReply }: { notice: Notice; onReply: () => void }) => {
    const { colors, fontSize } = useAtomValue(uiAtom)

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
              username: notice.member.username,
            })
          }}
        >
          <StyledImage
            style={tw`w-6 h-6 mr-3 rounded-full`}
            source={notice.member.avatar}
          />
        </Pressable>

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Separator style={tw`flex-1 mr-2`}>
              <Text
                style={tw`text-[${colors.foreground}] ${fontSize.medium}`}
                onPress={() => {
                  navigation.push('MemberDetail', {
                    username: notice.member.username,
                  })
                }}
              >
                {notice.member.username}
              </Text>
              <Text
                style={tw`text-[${colors.default}] ${fontSize.medium} flex-1`}
                numberOfLines={1}
              >
                {notice.created}
              </Text>
            </Separator>

            {!!notice.content &&
              !notice.prev_action_text.includes('感谢了你') && (
                <IconButton
                  style={tw`mr-2`}
                  color={colors.default}
                  activeColor={colors.primary}
                  size={15}
                  icon={<Feather name="message-circle" />}
                  onPress={onReply}
                />
              )}

            <DeleteNoticeButton id={notice.id} once={notice.once} />
          </View>

          <Text
            style={tw`flex-row flex-wrap ${fontSize.medium} text-[${colors.default}]`}
          >
            {notice.prev_action_text}
            <Text style={tw`text-[${colors.foreground}]`}>
              {notice.topic.title}
            </Text>
            {notice.next_action_text}
          </Text>

          {!!notice.content && (
            <View style={tw`bg-[${colors.base200}] px-4 py-3 mt-2 rounded`}>
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
  const { mutateAsync, isPending } = k.notification.delete.useMutation()

  const { colors } = useAtomValue(uiAtom)

  return (
    <IconButton
      size={16}
      name="delete-outline"
      color={colors.default}
      activeColor={colors.foreground}
      onPress={async () => {
        if (!isSignined()) {
          navigation.navigate('Login')
          return
        }

        if (isPending) return

        await confirm(`确认删除这条提醒么？`)

        const notifications = queryClient.getQueryData(
          k.notification.list.getKey()
        )

        try {
          queryClient.setQueryData(
            k.notification.list.getKey(),
            produce<inferData<typeof k.notification.list>>(draft => {
              for (const page of draft?.pages || []) {
                const index = findIndex(page.list, { id })
                if (index > -1) {
                  page.list.splice(index, 1)
                  break
                }
              }
            })
          )

          await mutateAsync({
            id,
            once,
          })
        } catch (error) {
          queryClient.setQueryData(k.notification.list.getKey(), notifications)
          Toast.show({
            type: 'error',
            text1: error instanceof BizError ? error.message : '删除失败',
          })
        }
      }}
    />
  )
}
