import { Ionicons } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { hashKey } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { RESET } from 'jotai/utils'
import {
  compact,
  isEmpty,
  isEqual,
  isString,
  maxBy,
  uniqBy,
  upperCase,
} from 'lodash-es'
import { useCallback, useMemo, useRef, useState } from 'react'
import { memo } from 'react'
import {
  FlatList,
  ListRenderItem,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { inferData } from 'react-query-kit'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { NAV_BAR_HEIGHT, useNavBarHeight } from '@/components/NavBar'
import NodeItem from '@/components/NodeItem'
import { FallbackComponent, QuerySuspense } from '@/components/QuerySuspense'
import SearchBar from '@/components/SearchBar'
import Separator, { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import { searchHistoryAtom } from '@/jotai/searchHistoryAtom'
import { sov2exArgsAtom } from '@/jotai/sov2exArgsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Member, Node, Sov2exResult, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import { confirm } from '@/utils/confirm'
import { useIsMatchedQuery } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default function SearchScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'Search'>>()
  const [searchText, setSearchText] = useState(params?.query || '')
  const trimedSearchText = searchText.trim()
  const [isSearchNode, setIsSearchNode] = useState(!params?.query)
  const { data: matchNodes = [] } = k.node.all.useQuery({
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
  const colorScheme = useAtomValue(colorSchemeAtom)
  const sov2exArgs = useAtomValue(sov2exArgsAtom)
  const { colors, fontSize } = useAtomValue(uiAtom)
  const [searchHistory, setSearchHistory] = useAtom(searchHistoryAtom)
  const handleSubmit = useCallback(
    (text: string) => {
      const trimedText = text.trim()
      setIsSearchNode(!trimedText)
      setSearchText(trimedText)

      if (trimedText) {
        setSearchHistory(prev => [
          trimedText,
          ...(prev.includes(trimedText)
            ? prev.filter(o => o !== trimedText)
            : prev.slice(0, 9)),
        ])
      }
    },
    [setSearchHistory]
  )
  const renderItem: ListRenderItem<Node | string> = useCallback(
    ({ item }) => {
      if (isString(item)) {
        const size = tw.style(fontSize.medium).fontSize as number

        return (
          <TouchableOpacity
            style={tw`h-[${NAV_BAR_HEIGHT}px] px-4 flex-row items-center`}
            onPress={() => {
              handleSubmit(item)
            }}
          >
            <Ionicons name="search" size={size + 5} color={colors.foreground} />
            <Text
              style={tw`${fontSize.medium} text-[${colors.foreground}] ml-2 flex-1`}
            >
              {item}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSearchHistory(prev => prev.filter(o => o !== item))
              }}
            >
              <Ionicons
                name="close-sharp"
                size={size + 3}
                color={colors.primary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )
      }

      return (
        <NodeItem
          node={item}
          onPress={() => {
            navigation.navigate('NodeTopics', { name: item.name })
          }}
        />
      )
    },
    [
      colors.foreground,
      colors.primary,
      fontSize.medium,
      handleSubmit,
      setSearchHistory,
    ]
  )

  const navbarHeight = useNavBarHeight()
  const isGoogleSearch = sov2exArgs.source === 'google'
  const inputRef = useRef<TextInput>(null)
  const onlyNodes = isEmpty(searchHistory) || !!trimedSearchText
  const sections = useMemo(() => {
    if (onlyNodes)
      return [
        {
          title: 'Node',
          data: matchNodes,
        },
      ]

    return [
      {
        title: 'History',
        data: searchHistory,
      },
      {
        title: 'Node',
        data: matchNodes,
      },
    ]
  }, [searchHistory, matchNodes, onlyNodes])

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      {isSearchNode ? (
        <SectionList
          key={colorScheme}
          initialNumToRender={20}
          keyExtractor={item =>
            isString(item)
              ? `History_${item}`
              : `Node_${item.title}_${item.name}`
          }
          contentContainerStyle={{
            paddingTop: navbarHeight,
          }}
          ListHeaderComponent={
            trimedSearchText ? (
              <TouchableOpacity
                style={tw`px-4 h-[${NAV_BAR_HEIGHT}px] flex-row items-center`}
                onPress={() => {
                  handleSubmit(trimedSearchText)
                }}
              >
                <Text
                  style={tw`text-[${colors.foreground}] ${fontSize.medium}`}
                >
                  {isGoogleSearch ? 'Google' : 'SOV2EX'}:{' '}
                  <Text style={tw`text-[${colors.foreground}]`}>
                    “{trimedSearchText}”
                  </Text>
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => {
            if (title === 'History') {
              return (
                <View
                  style={tw.style(
                    `px-4 h-[${NAV_BAR_HEIGHT}px] flex-row items-center justify-between`
                  )}
                >
                  <Text style={tw`text-[${colors.default}] ${fontSize.medium}`}>
                    搜索历史
                  </Text>

                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await confirm('确认清除搜索历史吗')
                        setSearchHistory(RESET)
                      } catch (error) {
                        // empty
                      }
                    }}
                  >
                    <Text
                      style={tw`text-[${colors.primary}] ${fontSize.medium}`}
                    >
                      清除全部
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            } else {
              return !isEmpty(matchNodes) ? (
                <View
                  style={tw.style(
                    `px-4 h-[${NAV_BAR_HEIGHT}px] flex-row items-center`,
                    !!trimedSearchText &&
                      onlyNodes &&
                      `border-[${colors.divider}] border-t border-solid`
                  )}
                >
                  <Text style={tw`text-[${colors.default}] ${fontSize.medium}`}>
                    {trimedSearchText ? '节点' : '全部节点'}
                  </Text>
                </View>
              ) : null
            }
          }}
          getItemLayout={(_, index) => ({
            length: NAV_BAR_HEIGHT,
            offset: index * NAV_BAR_HEIGHT,
            index,
          })}
          onScrollBeginDrag={() => {
            inputRef.current?.blur()
          }}
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
          {isGoogleSearch ? (
            <GoogleSearch
              query={trimedSearchText}
              navbarHeight={navbarHeight}
            />
          ) : (
            <SoV2exList
              key={colorScheme}
              query={trimedSearchText}
              navbarHeight={navbarHeight}
              onScrollBeginDrag={() => {
                inputRef.current?.blur()
              }}
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
              color={colors.foreground}
              activeColor={colors.foreground}
              onPress={() => {
                navigation.navigate('SearchOptions')
              }}
            />
          }
          style={tw.style(
            isGoogleSearch &&
              !isSearchNode &&
              `border-[${colors.divider}] border-solid border-b`
          )}
        >
          <SearchBar
            ref={inputRef}
            style={tw`flex-1`}
            value={searchText}
            onChangeText={text => {
              if (text !== searchText) {
                setIsSearchNode(true)
                setSearchText(text)
              }
            }}
            onSubmitEditing={() => {
              handleSubmit(searchText)
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
  onScrollBeginDrag,
}: {
  navbarHeight: number
  query: string
  onScrollBeginDrag: () => void
}) {
  const sov2exArgs = useAtomValue(sov2exArgsAtom)

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    k.other.sov2ex.useSuspenseInfiniteQuery({
      variables: { ...sov2exArgs, q: query },
    })

  const { data: nodeMap } = k.node.all.useQuery({
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

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <FlatList
      data={flatedData}
      onScrollBeginDrag={onScrollBeginDrag}
      ListHeaderComponent={
        !isEmpty(flatedData) ? (
          <View style={tw`px-4 py-2.5`}>
            <Text style={tw`text-[${colors.foreground}] ${fontSize.medium}`}>
              以下搜索结果来自于{' '}
              <Text
                style={tw`text-[${colors.primary}]`}
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
    const isReaded = useIsMatchedQuery(query => {
      if (
        query.queryHash === hashKey(k.topic.detail.getKey({ id: topic.id }))
      ) {
        const data = query.state.data as inferData<typeof k.topic.detail>
        const replyCount = maxBy(data?.pages, 'reply_count')?.reply_count || 0
        return replyCount >= topic.reply_count
      }
      return false
    })
    const { colors, fontSize } = useAtomValue(uiAtom)

    return (
      <DebouncedPressable
        style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
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
              style={tw`text-[${colors.foreground}] ${fontSize.medium} font-semibold flex-shrink`}
              numberOfLines={1}
              onPress={() => {
                navigation.push('MemberDetail', {
                  username: topic.member?.username!,
                })
              }}
            >
              {topic.member?.username}
            </Text>

            <Separator>
              {compact([
                <Text
                  key="created"
                  style={tw`text-[${colors.default}] ${fontSize.medium}`}
                >
                  {dayjs(topic.created).fromNow()}
                </Text>,
                !!topic.reply_count && (
                  <Text
                    key="replies"
                    style={tw`text-[${colors.default}] ${fontSize.medium}`}
                  >
                    {`${topic.reply_count} 回复`}
                  </Text>
                ),
              ])}
            </Separator>
          </View>

          <Text
            style={tw.style(
              `${fontSize.medium} font-medium pt-2`,
              isReaded
                ? `text-[${colors.default}]`
                : `text-[${colors.foreground}]`
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
                  `${fontSize.medium}`,
                  isReaded
                    ? `text-[${colors.default}]`
                    : `text-[${colors.foreground}]`
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

      if (a && /^https:\\/\\/(\\\w+\\.)?v2ex\\.com\\/t/.test(a.href)) {
        e.preventDefault();
        e.stopPropagation();
        window.ReactNativeWebView.postMessage(a.href)
      }
    }, {
        capture: true
    });
  } catch (err) {
  }
}())`

function GoogleSearch({
  navbarHeight,
  query,
}: {
  navbarHeight: number
  query: string
}) {
  const { colors } = useAtomValue(uiAtom)

  return (
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

        if (id) {
          navigation.push('TopicDetail', {
            id: parseInt(id, 10),
          })
        }
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      decelerationRate="normal"
      sharedCookiesEnabled={true}
      startInLoadingState={true}
      scalesPageToFit={true}
      renderLoading={() => (
        <LoadingIndicator
          style={tw.style(`absolute w-full h-full bg-[${colors.base100}]`, {
            paddingTop: navbarHeight,
          })}
        />
      )}
    />
  )
}
