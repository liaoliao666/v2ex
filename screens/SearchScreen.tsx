import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import {
  compact,
  isEmpty,
  isEqual,
  isString,
  uniqBy,
  upperCase,
} from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'
import { memo } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import NodeItem from '@/components/NodeItem'
import { QuerySuspense } from '@/components/QuerySuspense'
import SearchBar from '@/components/SearchBar'
import Separator, { LineSeparator } from '@/components/Separator'
import Space from '@/components/Space'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { sov2exArgsAtom } from '@/jotai/sov2exArgsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useNodes } from '@/servicies/node'
import { useSov2ex } from '@/servicies/sov2ex'
import { useTopicDetail } from '@/servicies/topic'
import { Member, Node, Sov2exResult } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default function SearchScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const { params } = useRoute<RouteProp<RootStackParamList, 'Search'>>()

  const [searchText, setSearchText] = useState(params?.query || '')

  const [isSearchNode, setIsSearchNode] = useState(!params?.query)

  const { data: matchNodes } = useNodes({
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
              isString(text) && upperCase(text).includes(upperCase(searchText))
          )
        )
      },
      [isSearchNode, searchText]
    ),
  })

  const handleClickNode = useCallback(
    (node: Node) => {
      navigation.navigate('NodeTopics', { name: node.name })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

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

  return (
    <View style={tw`flex-1 bg-body-1`}>
      {isSearchNode ? (
        <FlatList
          key={colorScheme}
          removeClippedSubviews={true}
          contentContainerStyle={{
            paddingTop: navbarHeight,
          }}
          ListHeaderComponent={
            <View>
              {!!searchText && (
                <Pressable
                  style={tw`px-4 py-2.5 border-tint-border border-b border-solid`}
                  onPress={() => {
                    setIsSearchNode(!searchText)
                  }}
                >
                  <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
                    SOV2EX: <Text style={tw`text-primary`}>{searchText}</Text>
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
        <QuerySuspense>
          <SoV2exList
            key={colorScheme}
            searchText={searchText}
            navbarHeight={navbarHeight}
          />
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
              setIsSearchNode(true)
              setSearchText(text.trim())
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
  searchText,
}: {
  navbarHeight: number
  searchText: string
}) {
  const sov2exArgs = useAtomValue(sov2exArgsAtom)

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSov2ex({ suspense: true, variables: { ...sov2exArgs, q: searchText } })

  const { data: nodeMap } = useNodes({
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
          node: nodeMap[item._source.node],
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
    () => uniqBy(data?.pages.map(page => page.hits).flat(), '_id'),
    [data?.pages]
  )

  return (
    <FlatList
      data={flatedData}
      removeClippedSubviews={true}
      ListHeaderComponent={
        !isEmpty(flatedData) ? (
          <View style={tw`px-4 py-2.5`}>
            <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
              以下搜索结果来自于{' '}
              <Text
                style={tw`text-primary`}
                onPress={() => {
                  openURL(`https://www.sov2ex.com`)
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
    const navigation =
      useNavigation<NativeStackNavigationProp<RootStackParamList>>()

    const { isFetched } = useTopicDetail({
      variables: { id: topic.id },
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
          <Space>
            {!!topic.node?.title && (
              <StyledButton
                size="mini"
                type="tag"
                onPress={() => {
                  navigation.push('NodeTopics', { name: topic.node?.name! })
                }}
              >
                {topic.node?.title}
              </StyledButton>
            )}
            <Text
              style={tw`text-tint-primary ${getFontSize(
                5
              )} font-semibold flex-1`}
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
          </Space>

          <Text
            style={tw.style(
              `${getFontSize(5)} font-medium pt-2`,
              isFetched ? `text-tint-secondary` : `text-tint-primary`
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
                  isFetched ? `text-tint-secondary` : `text-tint-primary`
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
