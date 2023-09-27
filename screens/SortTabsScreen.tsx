import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtom, useAtomValue } from 'jotai'
import { findIndex, isEmpty, some } from 'lodash-es'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { DragSortableView } from 'react-native-drag-sort'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getFontSize } from '@/jotai/fontSacleAtom'
import {
  HomeTab,
  allTabs,
  homeTabIndexAtom,
  homeTabsAtom,
} from '@/jotai/homeTabsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { useScreenWidth } from '@/utils/useScreenWidth'

export default function SortTabsScreen() {
  const parentWidth = useScreenWidth() - 24
  const itemWidth = parentWidth / Math.ceil(parentWidth / 100)
  const itemHeight = 36
  const [homeTabs, setHomeTabs] = useAtom(homeTabsAtom)
  const [selectedItems, setSelectedItems] = useState(homeTabs)
  const unselectedItems = useMemo(() => {
    const allSelectedTabKeys = new Set(selectedItems.map(tab => tab.key))
    return allTabs.filter(tab => !allSelectedTabKeys.has(tab.key))
  }, [selectedItems])
  const [tabIndex, setTabIndex] = useAtom(homeTabIndexAtom)
  const [isEdit, setIsEdit] = useState(false)

  const renderItem = useCallback(
    ({
      item,
      iconName,
      onIconPress,
    }: {
      item: HomeTab
      iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
      onIconPress?: () => void
    }) => {
      return (
        <View
          style={tw`w-[${itemWidth}px] h-[${itemHeight}px] px-1 flex-row justify-center items-center`}
        >
          <View
            style={tw.style(
              `w-[${
                itemWidth - 8
              }px] h-[${itemHeight}px] items-center rounded-full justify-center bg-body-2`
            )}
          >
            <Text style={tw`text-tint-primary ${getFontSize(5)}`}>
              {item.title}
            </Text>

            {!!iconName && (
              <Pressable
                style={tw.style(`absolute w-4 h-4`, {
                  top: -4,
                  right: -4,
                })}
                onPress={onIconPress}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  color={tw.color(`text-tint-secondary`)}
                  size={16}
                />
              </Pressable>
            )}
          </View>
        </View>
      )
    },
    [itemWidth]
  )

  useAtomValue(colorSchemeAtom)

  const handleSave = (saveItems: HomeTab[]) => {
    const nextTabIndex = findIndex(saveItems, {
      key: saveItems[tabIndex]?.key,
    })
    setTabIndex(nextTabIndex > -1 ? nextTabIndex : 0)
    setHomeTabs(saveItems)
  }

  return (
    <SafeAreaView edges={['top']} style={tw`flex-1 bg-body-1`}>
      <View style={tw`pl-4 pt-4 flex-row items-center justify-between`}>
        <Text style={tw`text-tint-primary ${getFontSize(4)} font-medium`}>
          首页板块
        </Text>

        <Pressable
          onPress={() => {
            navigation.goBack()
          }}
          style={tw`px-4`}
        >
          <MaterialCommunityIcons
            color={tw.color(`text-tint-secondary`)}
            size={20}
            name="close-circle"
          />
        </Pressable>
      </View>

      <View style={tw`px-4 pt-4 flex-row items-center`}>
        <Text style={tw`text-tint-primary ${getFontSize(5)} font-medium`}>
          我的板块
        </Text>
        <Text style={tw`text-tint-secondary ${getFontSize(6)} ml-2`}>
          {isEdit ? '长按拖拽排序' : '点击进入板块'}
        </Text>

        <View style={tw`ml-auto flex-row gap-2`}>
          <Pressable
            onPress={() => {
              navigation.navigate('SearchNode', {
                onPressNodeItem(node) {
                  if (
                    !some(
                      selectedItems,
                      o => o.key === node.name || o.title === node.title
                    )
                  ) {
                    const saveItems: HomeTab[] = [
                      ...selectedItems,
                      {
                        title: node.title,
                        key: node.name,
                        type: 'node',
                      },
                    ]
                    setSelectedItems(saveItems)
                    handleSave(saveItems)
                  }
                },
              })
            }}
          >
            {({ pressed }) => (
              <Text
                style={tw.style(
                  `${getFontSize(5)}`,
                  pressed ? `text-secondary-focus` : `text-secondary`
                )}
              >
                添加节点
              </Text>
            )}
          </Pressable>

          {isEdit && (
            <Pressable
              onPress={() => {
                setSelectedItems(allTabs)
              }}
            >
              {({ pressed }) => (
                <Text
                  style={tw.style(
                    `${getFontSize(5)}`,
                    pressed ? `text-secondary-focus` : `text-secondary`
                  )}
                >
                  重置
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              setIsEdit(!isEdit)
              if (isEdit) {
                handleSave(selectedItems)
              }
            }}
          >
            {({ pressed }) => (
              <Text
                style={tw.style(
                  `${getFontSize(5)}`,
                  pressed ? `text-secondary-focus` : `text-secondary`
                )}
              >
                {isEdit ? '完成' : '编辑'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={tw`px-3 pt-1.5`}>
        <DragSortableView
          dataSource={selectedItems}
          parentWidth={parentWidth}
          childrenWidth={itemWidth}
          childrenHeight={itemHeight}
          marginChildrenTop={10}
          sortable={isEdit}
          onDataChange={setSelectedItems}
          onClickItem={(_, item) => {
            if (isEdit) return
            setTabIndex(findIndex(homeTabs, { key: item.key }))
            navigation.goBack()
          }}
          keyExtractor={item => item.key}
          renderItem={item =>
            renderItem({
              item,
              iconName: isEdit ? 'close-circle' : undefined,
              onIconPress: () => {
                setSelectedItems(selectedItems.filter(o => o.key !== item.key))
              },
            })
          }
        />
      </View>

      <View style={tw`pl-4 pt-4 flex-row items-center`}>
        <Text style={tw`text-tint-primary ${getFontSize(5)} font-medium`}>
          更多板块
        </Text>
        <Text style={tw`text-tint-secondary ${getFontSize(6)} ml-2`}>
          点击添加板块
        </Text>
      </View>

      {isEmpty(unselectedItems) && (
        <View style={tw`py-2 px-4 m-4 bg-body-2 rounded-full`}>
          <Text style={tw`text-tint-secondary ${getFontSize(6)}`}>
            已全部添加至我的板块
          </Text>
        </View>
      )}

      <View style={tw`px-3 pt-1.5 flex-row flex-wrap`}>
        {unselectedItems.map(item => {
          const handleAddTab = () => {
            const newSelectedItems = [...selectedItems, item]
            setSelectedItems(newSelectedItems)

            if (!isEdit) {
              handleSave(newSelectedItems)
            }
          }
          return (
            <Pressable style={tw`mt-2.5`} key={item.key} onPress={handleAddTab}>
              {renderItem({
                item,
                iconName: 'plus-circle',
                onIconPress: handleAddTab,
              })}
            </Pressable>
          )
        })}
      </View>
    </SafeAreaView>
  )
}
