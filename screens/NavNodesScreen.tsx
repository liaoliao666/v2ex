import { useAtomValue } from 'jotai'
import { useCallback, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import NavBar, { NAV_BAR_HEIGHT, useNavBarHeight } from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { navigation } from '@/navigation/navigationRef'
import { nodeService } from '@/servicies/node'
import { Node } from '@/servicies/types'
import tw from '@/utils/tw'

export default withQuerySuspense(NavNodesScreen, {
  LoadingComponent: () => null,
})

const ITEM_HEIGHT = 88

function NavNodesScreen() {
  const navNodes = useAtomValue(navNodesAtom)

  const { data: routes = [] } = nodeService.all.useQuery({
    select: nodes => {
      const nodeMap: Record<string, Node> = Object.fromEntries(
        nodes.map(node => [node.name, node])
      )
      return [
        ...navNodes.map(node => ({
          title: node.title,
          key: node.title,
          nodes: node.nodeNames.map(name => nodeMap[name]).filter(Boolean),
        })),
        {
          title: '全部节点',
          key: 'all',
          nodes,
        },
      ]
    },
  })

  const [index, setIndex] = useState(0)

  const navbarHeight = useNavBarHeight()

  const renderItem: ListRenderItem<Node> = useCallback(({ item: node }) => {
    return (
      <TouchableOpacity
        key={node.id}
        onPress={() => {
          navigation.navigate('NodeTopics', { name: node.name })
        }}
        style={tw`w-1/3 py-1 items-center h-[${ITEM_HEIGHT}px]`}
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

  return (
    <View style={tw`bg-background flex-1`}>
      <View style={tw`flex-1 flex-row`}>
        <ScrollView
          style={tw`flex-none border-divider border-r border-solid`}
          contentContainerStyle={{
            paddingTop: navbarHeight,
          }}
        >
          {routes.map((route, i) => (
            <Pressable
              key={route.key}
              onPress={() => setIndex(i)}
              style={({ pressed }) =>
                tw.style(
                  `h-[${NAV_BAR_HEIGHT}px] px-4 items-center justify-center`,
                  pressed && `bg-focus`
                )
              }
            >
              <Text
                style={tw.style(
                  `${getFontSize(5)} text-foreground`,
                  i === index
                    ? tw`text-foreground font-medium`
                    : tw`text-default`
                )}
              >
                {route.title}
              </Text>
            </Pressable>
          ))}

          <SafeAreaView edges={['bottom']} />
        </ScrollView>

        <FlatList
          style={tw`flex-1`}
          contentContainerStyle={tw`px-4 pb-4 pt-[${navbarHeight}px]`}
          renderItem={renderItem}
          data={routes[index].nodes}
          numColumns={3}
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
          getItemLayout={(_, itemIndex) => ({
            length: ITEM_HEIGHT,
            offset: itemIndex * ITEM_HEIGHT,
            index: itemIndex,
          })}
        />
      </View>

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="节点导航" />
      </View>
    </View>
  )
}
