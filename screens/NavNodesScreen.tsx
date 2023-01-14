import { useNavigation } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { chunk } from 'lodash-es'
import { memo, useCallback, useState } from 'react'
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
import { useNodes } from '@/servicies/node'
import { Node } from '@/servicies/types'
import tw from '@/utils/tw'

export default withQuerySuspense(NavNodesScreen, { Loading: () => null })

function NavNodesScreen() {
  const navNodes = useAtomValue(navNodesAtom)

  const { data: routes = [] } = useNodes({
    select: nodes => {
      const nodeMap: Record<string, Node> = Object.fromEntries(
        nodes.map(node => [node.name, node])
      )
      return [
        ...navNodes.map(node => ({
          title: node.title,
          key: node.title,
          nodes: chunk(
            node.nodeNames.map(name => nodeMap[name]).filter(Boolean),
            3
          ),
        })),
        {
          title: '全部节点',
          key: 'all',
          nodes: chunk(nodes, 3),
        },
      ]
    },
  })

  const [index, setIndex] = useState(0)

  const navbarHeight = useNavBarHeight()

  const renderItem: ListRenderItem<Node[]> = useCallback(({ item }) => {
    return <NavNodeItem item={item} />
  }, [])

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <View style={tw`flex-1 flex-row`}>
        <ScrollView
          style={tw`flex-none border-tint-border border-r border-solid`}
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
                  pressed && `bg-tab-press`
                )
              }
            >
              <Text
                style={tw.style(
                  `text-body-5 text-tint-primary`,
                  i === index
                    ? tw`text-tint-primary font-bold`
                    : tw`text-tint-secondary font-medium`
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
          ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        />
      </View>

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="节点导航" />
      </View>
    </View>
  )
}

const NavNodeItem = memo(({ item }: { item: Node[] }) => {
  const navigation = useNavigation()

  return (
    <View key={item.map(o => o.name).join('_')} style={tw`flex flex-row`}>
      {item.map(node => {
        return (
          <TouchableOpacity
            key={node.id}
            onPress={() => {
              navigation.navigate('NodeTopics', { name: node.name })
            }}
            style={tw`w-1/3 py-2 items-center justify-center`}
          >
            <StyledImage
              style={tw`w-12 h-12`}
              source={{
                uri: node.avatar_large,
              }}
            />

            <Text style={tw`text-body-6 text-tint-primary text-center mt-2`}>
              {node.title}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
})
