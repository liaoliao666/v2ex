import { RouteProp, useRoute } from '@react-navigation/native'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import {
  compact,
  isEmpty,
  isEqual,
  isString,
  maxBy,
  omit,
  uniqBy,
  upperCase,
} from 'lodash-es'
import { useQuery, useSuspenseQuery } from 'quaere'
import { useCallback, useMemo, useState } from 'react'
import { memo } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import NodeItem from '@/components/NodeItem'
import { FallbackComponent, QuerySuspense } from '@/components/QuerySuspense'
import SearchBar from '@/components/SearchBar'
import Separator, { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { sov2exArgsAtom } from '@/jotai/sov2exArgsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { nodesQuery } from '@/servicies/node'
import { sov2exQuery } from '@/servicies/other'
import { topicDetailQuery } from '@/servicies/topic'
import { Member, Node, Sov2exResult } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { useRemoveUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default function SearchScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Search'>>()

  const [searchText, setSearchText] = useState(params?.query || '')

  const trimedSearchText = searchText.trim()

  const [isSearchNode, setIsSearchNode] = useState(!params?.query)

  const { data: matchNodes } = useQuery({
    query: nodesQuery,
    select: useCallback(
      (nodes: Node[]) => {
        if (!isSearchNode) return []
        return nodes.filter(node =>
          [
            node.title,
            node.title_alternative,
            node.name,
            ...(node.aliases || []),
          ].some(
            text =>
              isString(text) &&
              upperCase(text).includes(upperCase(trimedSearchText))
          )
        )
      },
      [isSearchNode, trimedSearchText]
    ),
  })

  const handleClickNode = useCallback((node: Node) => {
    navigation.navigate('NodeTopics', { name: node.name })
  }, [])

  const renderNodeItem: ListRenderItem<Node> = useCallback(
    ({ item }) => (
      <NodeItem
        key={`${item.title}_${item.name}`}
        node={item}
        onPressNodeItem={handleClickNode}
      />
    ),
    [handleClickNode]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const sov2exArgs = useAtomValue(sov2exArgsAtom)

  return (
    <View style={tw`flex-1 bg-body-1`}>
      {isSearchNode ? (
        <FlatList
          key={colorScheme}
          contentContainerStyle={{
            paddingTop: navbarHeight,
          }}
          ListHeaderComponent={
            <View>
              {!!trimedSearchText && (
                <Pressable
                  style={tw`px-4 py-2.5 border-tint-border border-b border-solid`}
                  onPress={() => {
                    setIsSearchNode(!trimedSearchText)
                  }}
                >
                  <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
                    SOV2EX:{' '}
                    <Text style={tw`text-primary`}>{trimedSearchText}</Text>
                  </Text>
                </Pressable>
              )}
              {!isEmpty(matchNodes) && (
                <View style={tw`px-4 pt-2.5 pb-2`}>
                  <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
                    节点
                  </Text>
                </View>
              )}
            </View>
          }
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
          data={matchNodes}
          renderItem={renderNodeItem}
        />
      ) : (
        <QuerySuspense
          loading={
            <TopicPlaceholder hideAvatar style={{ paddingTop: navbarHeight }} />
          }
          fallbackRender={fallbackProps => (
            <View style={{ paddingTop: navbarHeight }}>
              <FallbackComponent {...fallbackProps} />
            </View>
          )}
        >
          {sov2exArgs.source === 'google' ? (
            <GoogleSearch
              query={trimedSearchText}
              navbarHeight={navbarHeight}
            />
          ) : (
            <SoV2exList
              key={colorScheme}
              query={trimedSearchText}
              navbarHeight={navbarHeight}
            />
          )}
        </QuerySuspense>
      )}

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          right={
            <IconButton
              name="filter-outline"
              size={24}
              color={tw.color(`text-tint-primary`)}
              activeColor={tw.color(`text-tint-primary`)}
              onPress={() => {
                navigation.navigate('SearchOptions')
              }}
            />
          }
        >
          <SearchBar
            style={tw`flex-1`}
            value={searchText}
            onChangeText={text => {
              if (text !== searchText) {
                setIsSearchNode(true)
                setSearchText(text)
              }
            }}
            onSubmitEditing={() => {
              setIsSearchNode(!searchText)
            }}
            autoFocus
          />
        </NavBar>
      </View>
    </View>
  )
}

function SoV2exList({
  navbarHeight,
  query,
}: {
  navbarHeight: number
  query: string
}) {
  const sov2exArgs = useAtomValue(sov2exArgsAtom)

  useRemoveUnnecessaryPages({
    query: sov2exQuery,
    variables: { ...omit(sov2exArgs, ['source']), q: query },
  })

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseQuery({
      query: sov2exQuery,
      variables: { ...sov2exArgs, q: query },
    })

  const { data: nodeMap } = useQuery({
    query: nodesQuery,
    select: useCallback(
      (nodes: Node[]) => Object.fromEntries(nodes.map(node => [node.id, node])),
      []
    ),
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Sov2exResult['hits'][number]> = useCallback(
    ({ item }) => (
      <HitItem
        topic={{
          node: nodeMap?.[item._source.node],
          member: {
            username: item._source.member,
          },
          id: item._source.id,
          title: item._source.title,
          reply_count: item._source.replies,
          created: item._source.created.toString(),
          content: item.highlight?.content?.[0],
        }}
      />
    ),
    [nodeMap]
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.hits).flat(), '_id'),
    [data.pages]
  )

  return (
    <FlatList
      data={flatedData}
      ListHeaderComponent={
        !isEmpty(flatedData) ? (
          <View style={tw`px-4 py-2.5`}>
            <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
              以下搜索结果来自于{' '}
              <Text
                style={tw`text-primary`}
                onPress={() => {
                  navigation.navigate('Webview', {
                    url: `https://www.sov2ex.com`,
                  })
                }}
              >
                SOV2EX
              </Text>
            </Text>
          </View>
        ) : null
      }
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
      ListEmptyComponent={<Empty description="暂无搜索结果" />}
    />
  )
}

const HitItem = memo(
  ({
    topic,
  }: {
    topic: {
      node: Node
      member: Member
      id: number
      title: string
      reply_count: number
      created: string
      content: string
    }
  }) => {
    const { data: isReaded } = useQuery({
      query: topicDetailQuery,
      variables: { id: topic.id },
      select: data => {
        const replyCount = maxBy(data.pages, 'reply_count')?.reply_count || 0
        return replyCount >= topic.reply_count
      },
      enabled: false,
    })

    return (
      <DebouncedPressable
        style={tw`px-4 py-3 flex-row bg-body-1`}
        onPress={() => {
          navigation.push('TopicDetail', topic)
        }}
      >
        <View style={tw`flex-1`}>
          <View style={tw`flex-row gap-2`}>
            {!!topic.node?.title && (
              <StyledButton
                size="mini"
                type="tag"
                onPress={() => {
                  navigation.push('NodeTopics', {
                    name: topic.node?.name!,
                  })
                }}
              >
                {topic.node?.title}
              </StyledButton>
            )}
            <Text
              style={tw`text-tint-primary ${getFontSize(
                5
              )} font-semibold flex-shrink`}
              numberOfLines={1}
            >
              {topic.member?.username}
            </Text>

            <Separator>
              {compact([
                <Text
                  key="created"
                  style={tw`text-tint-secondary ${getFontSize(5)}`}
                >
                  {dayjs(topic.created).fromNow()}
                </Text>,
                !!topic.reply_count && (
                  <Text
                    key="replies"
                    style={tw`text-tint-secondary ${getFontSize(5)}`}
                  >
                    {`${topic.reply_count} 回复`}
                  </Text>
                ),
              ])}
            </Separator>
          </View>

          <Text
            style={tw.style(
              `${getFontSize(5)} font-medium pt-2`,
              isReaded ? `text-tint-secondary` : `text-tint-primary`
            )}
          >
            {topic.title}
          </Text>

          {!!topic.content && (
            <View style={tw`pt-2`}>
              <Html
                source={{
                  html: topic.content,
                }}
                baseStyle={tw.style(
                  `${getFontSize(5)}`,
                  isReaded ? `text-tint-secondary` : `text-tint-primary`
                )}
                defaultTextProps={{ selectable: false }}
              />
            </View>
          )}
        </View>
      </DebouncedPressable>
    )
  },
  isEqual
)

const getTopicLink = `(function() {
  try {
    document.body.addEventListener('click', function(e) {
      const a = e.target.closest('a');

      if (a && /^https:\\/\\/(\\\w+)\\.?v2ex\\.com\\/t/.test(a.href)) {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(a.href)
      }
    }, {
        capture: true
    });
  } catch (err) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      error: true,
      message: err.message
    }))
  }
}())`

function GoogleSearch({
  navbarHeight,
  query,
}: {
  navbarHeight: number
  query: string
}) {
  return (
    <View style={tw`flex-1`}>
      <WebView
        injectedJavaScript={getTopicLink}
        style={tw.style(`flex-1`, {
          marginTop: navbarHeight,
        })}
        source={{
          uri: `https://google.com/search?q=${encodeURIComponent(
            'site:v2ex.com/t ' + query
          )}`,
        }}
        onMessage={event => {
          const link = event.nativeEvent.data
          const [, id] =
            link.slice(link.indexOf('com') + 3).match(/\/\w+\/(\w+)/) || []

          navigation.push('TopicDetail', {
            id: parseInt(id, 10),
          })
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        decelerationRate="normal"
        sharedCookiesEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        renderLoading={() => (
          <LoadingIndicator
            style={tw.style(`absolute w-full h-full bg-body-1`, {
              paddingTop: navbarHeight,
            })}
          />
        )}
      />
    </View>
  )
}
