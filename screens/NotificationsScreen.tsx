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
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useDeleteNotice, useNotifications } from '@/servicies/notice'
import { Notice } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { confirm } from '@/utils/confirm'
import { queryClient } from '@/utils/query'
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
  const {
    data,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useNotifications({
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

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="未读提醒" />
      </View>
    </View>
  )
}

const NoticeItem = memo(
  ({ notice }: { notice: Notice }) => {
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

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
            <Separator>
              <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
                {notice.member.username}
              </Text>
              <Text style={tw`text-tint-secondary ${getFontSize(5)}`}>
                {notice.created}
              </Text>
            </Separator>

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
  const { mutateAsync, isLoading } = useDeleteNotice()

  const navigation = useNavigation()

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
