import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import produce from 'immer'
import { useAtomValue } from 'jotai'
import { findIndex, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import Separator, { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useDeleteNotice, useNotifications } from '@/servicies/notice'
import { Notice } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { validateLoginStatus } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(NotificationsScreen, {
  Loading: () => (
    <View style={tw`flex-1`}>
      <NavBar title="未读提醒" />
      <LoadingIndicator />
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
  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNotifications({
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Notice> = useCallback(
    ({ item }) => <NoticeItem key={item.id} notice={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar title="未读提醒" />

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
    </View>
  )
}

const NoticeItem = memo(({ notice }: { notice: Notice }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return (
    <Pressable
      style={tw`flex-row flex-wrap p-4`}
      onPress={() => {
        navigation.push('TopicDetail', {
          id: notice.topic.id,
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
          <Separator>
            <Text style={tw`text-tint-primary text-body-5`}>
              {notice.member.username}
            </Text>
            <Text style={tw`text-tint-secondary text-body-5`}>
              {notice.created}
            </Text>
          </Separator>

          <DeleteNoticeButton id={notice.id} once={notice.once} />
        </View>

        <Text style={tw`flex-row flex-wrap text-body-5 text-tint-secondary`}>
          {notice.prev_action_text}
          <Text style={tw`text-tint-primary`}>{notice.topic.title}</Text>
          {notice.next_action_text}
        </Text>

        {!!notice.content && (
          <View
            style={tw`bg-[#f0f3f5] dark:bg-[#262626] px-4 py-3 mt-2 rounded`}
          >
            <Html source={{ html: notice.content }} />
          </View>
        )}
      </View>
    </Pressable>
  )
})

function DeleteNoticeButton({ id, once }: { id: number; once: string }) {
  const { mutateAsync, isLoading } = useDeleteNotice()

  return (
    <IconButton
      size={16}
      name="delete-outline"
      color={tw`text-tint-secondary`.color as string}
      activeColor={tw`text-tint-primary`.color as string}
      onPress={async () => {
        validateLoginStatus()

        if (isLoading) return

        await confirm(`确认删除这条提醒么？`)

        const notifications = queryClient.getQueryData(
          useNotifications.getKey()
        ) as inferData<typeof useNotifications>

        try {
          queryClient.setQueryData<inferData<typeof useNotifications>>(
            useNotifications.getKey(),
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

          await mutateAsync({
            id,
            once,
          })
        } catch (error) {
          queryClient.setQueryData<inferData<typeof useNotifications>>(
            useNotifications.getKey(),
            notifications
          )
          Toast.show({
            type: 'error',
            text1: '删除失败',
          })
        }
      }}
    />
  )
}
