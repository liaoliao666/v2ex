import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { isString, upperCase } from 'lodash-es'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Empty from '@/components/Empty'
import NavBar, { NAV_BAR_HEIGHT } from '@/components/NavBar'
import NodeItem from '@/components/NodeItem'
import SearchBar from '@/components/SearchBar'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Node, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SearchNodeScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'SearchNode'>>()

  const [searchText, setSearchText] = useState('')
  const [selectedNodeNames, setSelectedNodeNames] = useState(
    () => new Set(params.selectedNodeNames || [])
  )

  const { data: allNodes = [] } = k.node.all.useQuery()

  const matchNodes = useMemo(() => {
    return searchText
      ? allNodes.filter(node =>
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
      : allNodes
  }, [allNodes, searchText])

  const selectedNodes = useMemo(
    () => allNodes.filter(node => selectedNodeNames.has(node.name)),
    [allNodes, selectedNodeNames]
  )

  const multiple = !!params.multiple

  const renderNodeItem: ListRenderItem<Node> = useCallback(
    ({ item }) => (
      <NodeItem
        key={`${item.title}_${item.name}`}
        node={item}
        selected={multiple && selectedNodeNames.has(item.name)}
        onPress={() => {
          if (!multiple) {
            navigation.goBack()
            params.onPressNodeItem?.(item)
            return
          }

          setSelectedNodeNames(prev => {
            const next = new Set(prev)
            if (next.has(item.name)) {
              next.delete(item.name)
            } else {
              next.add(item.name)
            }
            return next
          })
        }}
      />
    ),
    [multiple, params, selectedNodeNames]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const { colors, fontSize } = useAtomValue(uiAtom)

  const inputRef = useRef<TextInput>(null)

  return (
    <View style={tw`bg-[${colors.base100}] flex-1`}>
      <NavBar
        style={tw`border-[${colors.divider}] border-solid border-b`}
        hideSafeTop
        left={multiple ? undefined : null}
        right={
          <TouchableOpacity
            onPress={() => {
              if (multiple) {
                navigation.goBack()
                params.onSelectNodes?.(selectedNodes)
              } else {
                navigation.goBack()
              }
            }}
          >
            <Text style={tw`text-[${colors.primary}] ${fontSize.medium}`}>
              {multiple
                ? `完成${
                    selectedNodes.length ? `(${selectedNodes.length})` : ''
                  }`
                : '取消'}
            </Text>
          </TouchableOpacity>
        }
      >
        <SearchBar
          ref={inputRef}
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
        onScrollBeginDrag={() => {
          inputRef.current?.blur()
        }}
      />
    </View>
  )
}
