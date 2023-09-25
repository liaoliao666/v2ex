import { AntDesign } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import produce from 'immer'
import { useAtomValue } from 'jotai'
import { find, last, uniqBy } from 'lodash-es'
import { useMutation, useQuery, useSuspenseQuery } from 'quaere'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Platform, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Empty from '@/components/Empty'
import Html from '@/components/Html'
import IconButton from '@/components/IconButton'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import TopicItem from '@/components/topic/TopicItem'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { likeNodeMutation, nodeTopicsQuery, nodesQuery } from '@/servicies/node'
import { Topic } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { queryClient, useRemoveUnnecessaryPages } from '@/utils/query'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

const TOP_BAR_BG_CLS = `bg-[rgb(51,51,68)]`

export default withQuerySuspense(NodeTopicsScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1 bg-body-1`}>
      <NavBar
        style={tw.style(TOP_BAR_BG_CLS, 'border-b-0')}
        title="节点"
        tintColor="#fff"
        statusBarStyle="light"
      />
      <NodeInfo hideLike />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar
        style={tw.style(TOP_BAR_BG_CLS, 'border-b-0')}
        title="节点"
        tintColor="#fff"
        statusBarStyle="light"
      />
      <NodeInfo hideLike />
      <FallbackComponent {...props} />
    </View>
  ),
})

function NodeTopicsScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'NodeTopics'>>()

  useRemoveUnnecessaryPages({
    query: nodeTopicsQuery,
    variables: { name: params.name },
  })

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSuspenseQuery({
      query: nodeTopicsQuery,
      variables: { name: params.name },
    })

  const { data: node } = useQuery({
    query: nodesQuery,
    select: nodes => find(nodes, { name: params.name }),
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const lastPage = last(data.pages)!

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data.pages.map(page => page.list).flat(), 'id'),
    [data.pages]
  )

  const [avatarVisible, setAvatarVisible] = useState(true)

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar
        title="节点"
        statusBarStyle="light"
        tintColor="#fff"
        style={tw.style(TOP_BAR_BG_CLS, 'border-b-0')}
      >
        {!avatarVisible && (
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white ${getFontSize(4)} font-semibold`}>
                {node?.title}
              </Text>

              <Text style={tw`text-[#e7e9ea] ${getFontSize(6)}`}>
                主题总数{node?.topics}
              </Text>
            </View>

            <LikeNode
              type="button"
              stars={node?.stars}
              id={node?.id}
              once={lastPage.once}
              liked={lastPage.liked}
              name={node?.name!}
            />
          </View>
        )}
      </NavBar>

      <FlatList
        key={colorScheme}
        data={flatedData}
        ListHeaderComponent={
          <NodeInfo once={lastPage.once} liked={lastPage.liked} />
        }
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            style={tw.style(TOP_BAR_BG_CLS)}
            tintColor={Platform.OS === 'ios' ? '#fff' : undefined}
          />
        }
        ListEmptyComponent={<Empty description="无法访问该节点" />}
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
        onScroll={ev => {
          setAvatarVisible(ev.nativeEvent.contentOffset.y <= 64)
        }}
      />
    </View>
  )
}

function NodeInfo({
  once,
  liked,
  hideLike,
}: {
  once?: string
  liked?: boolean
  hideLike?: boolean
}) {
  const { params } = useRoute<RouteProp<RootStackParamList, 'NodeTopics'>>()

  const { data: node } = useQuery({
    query: nodesQuery,
    select: nodes => find(nodes, { name: params.name }),
  })

  return (
    <View
      style={tw`${TOP_BAR_BG_CLS} px-4 pt-[200px] -mt-[188px] pb-3 flex-row`}
    >
      <StyledImage
        style={tw`w-12 h-12 mr-3 rounded`}
        source={{
          uri: node?.avatar_large,
        }}
      />

      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-white ${getFontSize(4)} font-semibold`}>
            {node?.title}
          </Text>

          {!hideLike && (
            <LikeNode
              type="icon"
              stars={node?.stars}
              id={node?.id}
              once={once}
              liked={liked}
              name={node?.name!}
            />
          )}
        </View>

        <View style={tw`mt-1 flex-row justify-between`}>
          {node?.header && (
            <Html
              baseStyle={tw`text-[#e7e9ea] ${getFontSize(6)}`}
              tagsStyles={{ a: tw`text-[#03C8FF] no-underline` }}
              source={{ html: node?.header }}
            />
          )}
        </View>
      </View>
    </View>
  )
}

function LikeNode({
  id,
  name,
  once,
  stars = 0,
  liked,
  type,
}: {
  id?: number
  name: string
  once?: string
  stars?: number
  liked?: boolean
  type: 'button' | 'icon'
}) {
  const { trigger, isMutating } = useMutation({
    mutation: likeNodeMutation,
  })

  async function likeNode() {
    if (!isSignined()) {
      navigation.navigate('Login')
      return
    }

    if (isMutating) return
    if (!id || !once) return

    try {
      updateNode(name, {
        liked: !liked,
        stars: stars + (liked ? -1 : 1),
      })

      await trigger({
        id,
        type: liked ? 'unfavorite' : 'favorite',
        once,
      })
    } catch (error) {
      updateNode(name, {
        liked,
        stars,
      })
      Toast.show({
        type: 'error',
        text1: '操作失败',
      })
    }
  }

  if (type === 'button') {
    return (
      <StyledButton shape="rounded" onPress={likeNode}>
        {liked ? `已收藏` : `收藏`}
      </StyledButton>
    )
  }

  return (
    <View style={tw.style(`flex-row items-center`)}>
      <Text
        style={tw.style(
          `${getFontSize(6)} px-1.5`,
          liked ? `text-[rgb(250,219,20)]` : `text-[#e7e9ea]`
        )}
      >
        {!!stars && stars}
      </Text>

      <IconButton
        size={16}
        icon={<AntDesign name={liked ? 'star' : 'staro'} />}
        color={'#e7e9ea'}
        activeColor="rgb(250,219,20)"
        active={liked}
        onPress={likeNode}
      />
    </View>
  )
}

function updateNode(
  name: string,
  node: {
    liked?: boolean
    stars: number
  }
) {
  queryClient.setQueryData(
    {
      query: nodeTopicsQuery,
      variables: { name },
    },
    produce(data => {
      data?.pages.forEach(page => {
        Object.assign(page, node)
      })
    })
  )
}
