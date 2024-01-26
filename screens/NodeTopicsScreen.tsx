import { AntDesign } from '@expo/vector-icons'
import { RouteProp, useRoute } from '@react-navigation/native'
import { darken, lighten } from 'color2k'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import { find, last, uniqBy } from 'lodash-es'
import { useCallback, useMemo, useRef } from 'react'
import { Animated, ListRenderItem, Platform, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { inferData } from 'react-query-kit'

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
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { formatColor, getUI, uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
import { BizError } from '@/utils/request'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

function getTopBarBgCls() {
  const { colors } = getUI()
  if (colors.base100 === 'rgba(255,255,255,1)') return `bg-[rgb(51,51,68)]`
  return `bg-[${formatColor(
    store.get(colorSchemeAtom) === 'light'
      ? darken(colors.base300, 0.6)
      : lighten(colors.base300, 0.2)
  )}]`
}

export default withQuerySuspense(NodeTopicsScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1 bg-[${getUI().colors.base100}]`}>
      <NavBar
        style={tw.style(getTopBarBgCls(), 'border-b-0 z-20')}
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
        style={tw.style(getTopBarBgCls(), 'border-b-0 z-20')}
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

  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    k.node.topics.useSuspenseInfiniteQuery({
      variables: { name: params.name },
    })

  const { data: node } = k.node.all.useQuery({
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

  const colorScheme = useAtomValue(colorSchemeAtom)

  const scrollY = useRef(new Animated.Value(0)).current

  const { fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar
        statusBarStyle="light"
        tintColor="#fff"
        style={tw.style(getTopBarBgCls(), 'border-b-0 z-10')}
      >
        <Animated.View
          style={tw.style(`flex-row items-center flex-1`, {
            opacity: scrollY.interpolate({
              inputRange: [12, 70],
              outputRange: [0, 1],
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [12, 80],
                  outputRange: [68, 0],
                  extrapolate: 'clamp',
                }),
              },
            ],
          })}
        >
          <View style={tw`flex-1`}>
            <Text style={tw`text-white ${fontSize.large} font-semibold`}>
              {node?.title}
            </Text>

            <Text style={tw`text-[#e7e9ea] ${fontSize.small}`}>
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
        </Animated.View>
      </NavBar>

      <Animated.FlatList
        key={colorScheme}
        data={flatedData}
        ListHeaderComponent={
          <NodeInfo once={lastPage.once} liked={lastPage.liked} />
        }
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            style={tw.style(`z-10`)}
            tintColor={Platform.OS === 'ios' ? '#fff' : undefined}
          />
        }
        ListEmptyComponent={
          <Empty
            description={
              !!node?.stars && node.stars < 10
                ? '目前还没有帖子'
                : '无法访问该节点'
            }
          />
        }
        ItemSeparatorComponent={LineSeparator}
        renderItem={renderItem}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
          }
        )}
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

  const { data: node } = k.node.all.useQuery({
    select: nodes => find(nodes, { name: params.name }),
  })

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View>
      <View
        style={tw`${getTopBarBgCls()} absolute -top-[999px] bottom-3 inset-x-0 -z-10`}
      />

      <View style={tw`${getTopBarBgCls()} px-4 py-3 flex-row z-10`}>
        <StyledImage
          style={tw`w-12 h-12 mr-3 rounded`}
          source={node?.avatar_large}
        />

        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Text style={tw`text-white ${fontSize.large} font-semibold`}>
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
            {node?.header ? (
              <Html
                baseStyle={tw`text-[#e7e9ea] ${fontSize.small}`}
                tagsStyles={{ a: tw`text-[${colors.primary}] no-underline` }}
                source={{ html: node?.header }}
              />
            ) : (
              <Text style={tw`text-[#e7e9ea] ${fontSize.small}`}>
                主题总数{node?.topics}
              </Text>
            )}
          </View>
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
  const { mutateAsync, isPending } = k.node.like.useMutation()

  const { fontSize } = useAtomValue(uiAtom)

  async function likeNode() {
    if (!isSignined()) {
      navigation.navigate('Login')
      return
    }

    if (isPending) return
    if (!id || !once) return

    try {
      updateNode(name, {
        liked: !liked,
        stars: stars + (liked ? -1 : 1),
      })

      await mutateAsync({
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
        text1: error instanceof BizError ? error.message : '操作失败',
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
          `${fontSize.small} px-1.5`,
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
    k.node.topics.getKey({ name }),
    produce<inferData<typeof k.node.topics>>(data => {
      data?.pages.forEach(page => {
        Object.assign(page, node)
      })
    })
  )
}
