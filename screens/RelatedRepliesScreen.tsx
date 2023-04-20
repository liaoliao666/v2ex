import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { find, findIndex, isEmpty, last, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import NavBar, { NAV_BAR_HEIGHT } from '@/components/NavBar'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import ReplyItem from '@/components/topic/ReplyItem'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

interface RelatedReply extends Reply {
  related: boolean
}

export default function RelatedRepliesScreen() {
  const {
    params: { replyId, topicId },
  } = useRoute<RouteProp<RootStackParamList, 'RelatedReplies'>>()

  const { data } = useTopicDetail({
    variables: { id: topicId },
    enabled: false,
  })

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.replies).flat() || [], 'id'),
    [data?.pages]
  )

  const routes = useMemo(() => {
    const currentReply = find(flatedData, { id: replyId })
    if (!currentReply) return []
    const replyName = currentReply.member.username
    const replyAtNameList = getAtNameList(currentReply.content)

    const results = [] as {
      key: string
      title: string
      avatar?: string
      data: RelatedReply[]
      relatedData: RelatedReply[]
    }[]

    replyAtNameList.forEach(atName => {
      const result: typeof results[number] = {
        key: atName,
        title: atName,
        data: [],
        relatedData: [],
      }

      flatedData.forEach(reply => {
        if (reply.member.username === replyName) {
          const related = isRelatedReply(reply.content, replyName, atName)
          const item = {
            ...reply,
            related,
          } as const

          if (related) {
            result.relatedData.push(item)
          }
          result.data.push(item)
        } else if (reply.member.username === atName) {
          result.avatar = reply.member.avatar
          const related =
            replyId === reply.id ||
            isRelatedReply(reply.content, replyName, atName)
          const item = {
            ...reply,
            related,
          } as const

          if (related) {
            result.relatedData.push(item)
          }
          result.data.push(item)
        }
      })

      if (!isEmpty(result.data)) {
        results.push(result)
      }
    })

    return results
  }, [flatedData, replyId])

  const [isSmartMode, setIsSmartMode] = useState<boolean>(true)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const [index, setIndex] = useState(0)

  const layout = useWindowDimensions()

  const currentRoute = routes[index]

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <NavBar
        title="评论回复"
        hideSafeTop
        right={
          currentRoute.data.length !== currentRoute.relatedData.length && (
            <StyledButton
              shape="rounded"
              ghost={!isSmartMode}
              onPress={() => {
                setIsSmartMode(!isSmartMode)
              }}
            >
              智能模式
            </StyledButton>
          )
        }
      />

      {routes.length === 1 && (
        <Replies
          replies={isSmartMode ? currentRoute.relatedData : currentRoute.data}
        />
      )}

      {routes.length > 1 && (
        <TabView
          key={colorScheme}
          navigationState={{ index, routes }}
          lazy
          lazyPreloadDistance={1}
          renderScene={({ route }) => (
            <Replies replies={isSmartMode ? route.relatedData : route.data} />
          )}
          onIndexChange={setIndex}
          initialLayout={{
            width: layout.width,
          }}
          renderTabBar={props => (
            <TabBar
              {...props}
              scrollEnabled
              style={tw`bg-body-1 flex-row shadow-none border-b border-tint-border border-solid`}
              tabStyle={tw`w-[100px] h-[${NAV_BAR_HEIGHT}px]`}
              indicatorStyle={tw`w-[40px] ml-[30px] bg-primary h-1 rounded-full`}
              indicatorContainerStyle={tw`border-0`}
              renderTabBarItem={({ route }) => {
                const active = currentRoute.key === route.key

                return (
                  <Pressable
                    key={route.key}
                    style={({ pressed }) =>
                      tw.style(
                        `w-[100px] px-1 flex-row items-center justify-center h-[${NAV_BAR_HEIGHT}px]`,
                        pressed && tw`bg-tab-press`
                      )
                    }
                    onPress={() => {
                      setIndex(findIndex(routes, { key: route.key }))
                    }}
                  >
                    <StyledImage
                      style={tw`w-5 h-5 rounded-full`}
                      source={{ uri: route.avatar }}
                    />
                    <Text
                      style={tw.style(
                        `ml-2 ${getFontSize(5)} flex-shrink`,
                        active
                          ? tw`text-tint-primary font-semibold`
                          : tw`text-tint-secondary font-medium`
                      )}
                      numberOfLines={1}
                    >
                      {route.title}
                    </Text>
                  </Pressable>
                )
              }}
            />
          )}
        />
      )}
    </View>
  )
}

const Replies = memo(({ replies }: { replies: RelatedReply[] }) => {
  const {
    params: { onReply, topicId },
  } = useRoute<RouteProp<RootStackParamList, 'RelatedReplies'>>()

  const {
    data,
    hasNextPage,
    isFetchedAfterMount,
    fetchNextPage,
    isFetchingNextPage,
  } = useTopicDetail({
    variables: { id: topicId },
    enabled: false,
  })

  const lastPage = last(data?.pages)!

  const renderItem: ListRenderItem<RelatedReply> = useCallback(
    ({ item }) => (
      <ReplyItem
        key={item.id}
        reply={item as Reply}
        topicId={lastPage.id}
        once={lastPage.once}
        onReply={onReply}
        related={item.related}
        inModalScreen
      />
    ),
    [lastPage.id, lastPage.once, onReply]
  )

  return (
    <FlatList
      data={replies}
      renderItem={renderItem}
      onEndReached={() => {
        if (hasNextPage && !isFetchedAfterMount) {
          fetchNextPage()
        }
      }}
      onEndReachedThreshold={0.3}
      ItemSeparatorComponent={LineSeparator}
      ListFooterComponent={
        <SafeAreaView edges={['bottom']}>
          {isFetchingNextPage ? (
            <StyledActivityIndicator style={tw`py-4`} />
          ) : null}
        </SafeAreaView>
      }
    />
  )
})

// https://github.dev/sciooga/v2ex-plus
//获取被@的用户
function getAtNameList(replyContent: string) {
  const nameList = new Set<string>()
  const pattAtName = RegExp('@<a href="/member/(.+?)">', 'g')

  let match = pattAtName.exec(replyContent)
  while (match) {
    nameList.add(match[1])
    match = pattAtName.exec(replyContent)
  }

  return nameList
}

//判断是否为相关的回复
function isRelatedReply(
  replyContent: string,
  replyUserName: string,
  replyAtName: string
) {
  const atNameList = getAtNameList(replyContent)
  return (
    atNameList.size === 0 ||
    atNameList.has(replyUserName) ||
    atNameList.has(replyAtName)
  )
}
