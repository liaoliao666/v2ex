import { useAtomValue } from 'jotai'
import { useCallback } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Empty from '@/components/Empty'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { Node, k } from '@/servicies'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(MyNodesScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="节点收藏" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="节点收藏" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const ITEM_HEIGHT = 88

function MyNodesScreen() {
  const { data: myNodes, refetch } = k.my.nodes.useSuspenseQuery()

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Node> = useCallback(({ item: node }) => {
    return (
      <TouchableOpacity
        key={node.id}
        onPress={() => {
          navigation.navigate('NodeTopics', { name: node.name })
        }}
        style={tw`w-1/4 py-1 items-center h-[${ITEM_HEIGHT}px]`}
      >
        <StyledImage
          style={tw`w-12 h-12`}
          source={{
            uri: node.avatar_large,
          }}
        />

        <Text
          style={tw`${getFontSize(6)} mt-auto text-foreground text-center`}
          numberOfLines={1}
        >
          {node.title}
        </Text>
      </TouchableOpacity>
    )
  }, [])

  const colorScheme = useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      <FlatList
        key={colorScheme}
        contentContainerStyle={tw`px-4 pb-4 pt-[${navbarHeight}px]`}
        renderItem={renderItem}
        data={myNodes}
        numColumns={4}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
            progressViewOffset={navbarHeight}
          />
        }
        ListEmptyComponent={<Empty description={`目前还没有收藏节点`} />}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        getItemLayout={(_, itemIndex) => ({
          length: ITEM_HEIGHT,
          offset: itemIndex * ITEM_HEIGHT,
          index: itemIndex,
        })}
      />

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="节点收藏" />
      </View>
    </View>
  )
}
