import { useNavigation } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { chunk } from 'lodash-es'
import { useCallback } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import StyledImage from '@/components/StyledImage'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useMyNodes } from '@/servicies/node'
import { useNodes } from '@/servicies/node'
import { Node } from '@/servicies/types'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(MyNodesScreen, {
  Loading: () => (
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
  const { data: nodes } = useNodes({
    suspense: true,
    select: data => Object.fromEntries(data.map(node => [node.name, node])),
  })

  const { data: myNodes, refetch } = useMyNodes({
    suspense: true,
    select: data =>
      chunk(
        data?.map(name => nodes![name]),
        4
      ),
  })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const navigation = useNavigation()

  const renderItem: ListRenderItem<Node[]> = useCallback(
    ({ item }) => {
      return (
        <View key={item.map(o => o.name).join('_')} style={tw`flex flex-row`}>
          {item.map(node => {
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
                  style={tw`text-body-6 text-tint-primary text-center mt-2`}
                >
                  {node.title}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar title="节点收藏" />

      <FlatList
        removeClippedSubviews
        key={colorScheme}
        contentContainerStyle={tw`p-4`}
        renderItem={renderItem}
        data={myNodes}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
          />
        }
        ListEmptyComponent={
          <View style={tw`items-center justify-center py-16`}>
            <Text style={tw`text-tint-secondary text-body-6`}>
              目前还没有收藏节点
            </Text>
          </View>
        }
      />
    </View>
  )
}
