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
import { navNodesAtom } from '@/jotai/navNodesAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Node, k } from '@/servicies'
import tw from '@/utils/tw'

export default withQuerySuspense(NavNodesScreen, {
  LoadingComponent: () => null,
})

const ITEM_HEIGHT = 88

function NavNodesScreen() {
  const navNodes = useAtomValue(navNodesAtom)

  const { data: routes = [] } = k.node.all.useQuery({
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

  const { colors, fontSize } = useAtomValue(uiAtom)

  const renderItem: ListRenderItem<Node> = useCallback(
    ({ item: node }) => {
      return (
        <TouchableOpacity
          key={node.id}
          onPress={() => {
            navigation.navigate('NodeTopics', { name: node.name })
          }}
          style={tw`w-1/3 py-1 items-center h-[${ITEM_HEIGHT}px]`}
        >
          <StyledImage style={tw`w-12 h-12`} source={node.avatar_large} />

          <Text
            style={tw`${fontSize.small} mt-auto text-[${colors.foreground}] text-center`}
            numberOfLines={1}
          >
            {node.title}
          </Text>
        </TouchableOpacity>
      )
    },
    [colors, fontSize]
  )

  return (
    <View style={tw`bg-[${colors.base100}] flex-1`}>
      <View style={tw`flex-1 flex-row`}>
        <ScrollView
          style={tw`flex-none border-[${colors.divider}] border-r border-solid`}
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
                  pressed && `bg-[${colors.foreground}] bg-opacity-10`
                )
              }
            >
              <Text
                style={tw.style(
                  `${fontSize.medium} text-[${colors.foreground}]`,
                  i === index
                    ? tw`text-[${colors.foreground}] font-medium`
                    : tw`text-[${colors.default}]`
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
