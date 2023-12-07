import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { isString, upperCase } from 'lodash-es'
import { useCallback, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Empty from '@/components/Empty'
import NavBar, { NAV_BAR_HEIGHT } from '@/components/NavBar'
import NodeItem from '@/components/NodeItem'
import SearchBar from '@/components/SearchBar'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { nodeService } from '@/servicies/node'
import { Node } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SearchNodeScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'SearchNode'>>()

  const [searchText, setSearchText] = useState('')

  const { data: matchNodes } = nodeService.all.useQuery({
    select: useCallback(
      (nodes: Node[]) => {
        return searchText
          ? nodes.filter(node =>
              [
                node.title,
                node.title_alternative,
                node.name,
                ...(node.aliases || []),
              ].some(
                text =>
                  isString(text) &&
                  upperCase(text).includes(upperCase(searchText))
              )
            )
          : nodes
      },
      [searchText]
    ),
  })

  const handlePressNodeItem = useCallback((node: Node) => {
    navigation.goBack()
    params.onPressNodeItem(node)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderNodeItem: ListRenderItem<Node> = useCallback(
    ({ item }) => (
      <NodeItem
        key={`${item.title}_${item.name}`}
        node={item}
        onPressNodeItem={handlePressNodeItem}
      />
    ),
    [handlePressNodeItem]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`bg-background flex-1`}>
      <NavBar
        style={tw`border-divider border-solid border-b`}
        hideSafeTop
        left={null}
        right={
          <TouchableOpacity
            onPress={() => {
              navigation.goBack()
            }}
          >
            <Text style={tw`text-primary ${getFontSize(5)}`}>取消</Text>
          </TouchableOpacity>
        }
      >
        <SearchBar
          style={tw`flex-1`}
          value={searchText}
          onChangeText={text => {
            setSearchText(text.trim())
          }}
          autoFocus
          placeholder="搜索节点"
        />
      </NavBar>

      <FlatList
        key={colorScheme}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        data={matchNodes}
        renderItem={renderNodeItem}
        ListEmptyComponent={<Empty description="暂无搜索结果" />}
        getItemLayout={(_, index) => ({
          length: NAV_BAR_HEIGHT,
          offset: index * NAV_BAR_HEIGHT,
          index,
        })}
      />
    </View>
  )
}
