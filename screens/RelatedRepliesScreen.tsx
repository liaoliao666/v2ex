import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { find, findIndex, isEmpty, last, uniqBy } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabBar, TabView } from 'react-native-tab-view'

import NavBar from '@/components/NavBar'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import ReplyItem from '@/components/topic/ReplyItem'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { Reply, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

const TAB_BAR_HEIGHT = 40

interface RelatedReply extends Reply {
  related: boolean
}

export default function RelatedRepliesScreen() {
  const {
    params: { replyId, topicId },
  } = useRoute<RouteProp<RootStackParamList, 'RelatedReplies'>>()

  const { data } = k.topic.detail.useInfiniteQuery({
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
      const result: (typeof results)[number] = {
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

  const isSingleRoute = routes.length <= 1

  return (
    <View style={tw`bg-background flex-1`}>
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
        style={
          isSingleRoute
            ? tw`border-divider border-b border-solid`
            : tw`border-b-0`
        }
      />

      {isSingleRoute && (
        <Replies
          replies={isSmartMode ? currentRoute.relatedData : currentRoute.data}
        />
      )}

      {!isSingleRoute && (
        <TabView
          key={colorScheme}
          navigationState={{ index, routes }}
          lazy
          lazyPreloadDistance={1}
          renderScene={({ route }) => (
            <Replies replies={isSmartMode ? route.relatedData : route.data} />
          )}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          overdrag={false}
          renderTabBar={props => (
            <View style={tw`border-b border-divider border-solid px-2`}>
              <TabBar
                {...props}
                scrollEnabled
                style={tw`bg-background flex-row shadow-none`}
                tabStyle={tw`w-[100px] h-[${TAB_BAR_HEIGHT}px]`}
                indicatorStyle={tw`w-[40px] ml-[30px] bg-foreground h-1 rounded-full`}
                indicatorContainerStyle={tw`border-0`}
                renderTabBarItem={({ route }) => {
                  const active = currentRoute.key === route.key

                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={tw`w-[100px] flex-row items-center justify-center h-[${TAB_BAR_HEIGHT}px]`}
                      activeOpacity={active ? 1 : 0.5}
                      onPress={() => {
                        setIndex(findIndex(routes, { key: route.key }))
                      }}
                    >
                      <StyledImage
                        style={tw`w-5 h-5 rounded-full`}
                        source={route.avatar}
                      />
                      <Text
                        style={tw.style(
                          `ml-2 ${getFontSize(5)} flex-shrink`,
                          active
                            ? tw`text-foreground font-semibold`
                            : tw`text-default font-medium`
                        )}
                        numberOfLines={1}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            </View>
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
    fetchNextPage,
    isFetchingNextPage,
    isFetchedAfterMount,
  } = k.topic.detail.useInfiniteQuery({
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
        // only fetch once when scroll to bottom
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
