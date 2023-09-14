import { useNavigation } from '@react-navigation/native'
import { useSuspenseQueries } from '@tanstack/react-query'
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
import { useMyNodes } from '@/servicies/node'
import { useNodes } from '@/servicies/node'
import { Node } from '@/servicies/types'
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

function MyNodesScreen() {
  const { myNodes, refetchMyNodes } = useSuspenseQueries({
    queries: [useNodes.getFetchOptions(), useMyNodes.getFetchOptions()],
    combine: ([{ data: nodes }, { data: myNodeNames, refetch }]) => {
      const nodeMap = Object.fromEntries(nodes.map(node => [node.name, node]))
      return {
        myNodes: myNodeNames?.map(name => nodeMap[name]!),
        refetchMyNodes: refetch,
      }
    },
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetchMyNodes)

  const navigation = useNavigation()

  const renderItem: ListRenderItem<Node> = useCallback(
    ({ item: node }) => {
      return (
        <TouchableOpacity
          key={node.id}
          onPress={() => {
            navigation.navigate('NodeTopics', { name: node.name })
          }}
          style={tw`w-1/4 p-2 items-center justify-center`}
        >
          <StyledImage
            style={tw`w-12 h-12`}
            source={{
              uri: node.avatar_large,
            }}
          />

          <Text
            style={tw`${getFontSize(6)} text-tint-primary text-center mt-2`}
          >
            {node.title}
          </Text>
        </TouchableOpacity>
      )
    },
    [navigation]
  )

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
      />

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="节点收藏" />
      </View>
    </View>
  )
}
