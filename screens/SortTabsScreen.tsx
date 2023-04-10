import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useAtom, useAtomValue } from 'jotai'
import { findIndex, isEmpty } from 'lodash-es'
import { useMemo, useState } from 'react'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { DragSortableView } from 'react-native-drag-sort'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getFontSize } from '@/jotai/fontSacleAtom'
import {
  HomeTab,
  allHomeTabs,
  homeTabIndexAtom,
  homeTabsAtom,
} from '@/jotai/homeTabsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import tw from '@/utils/tw'

export default function SortTabsScreen() {
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const parentWidth = width - 24
  const itemWidth = parentWidth / 4
  const itemHeight = 36
  const [homeTabs, setHomeTabs] = useAtom(homeTabsAtom)
  const [selectedItems, setSelectedItems] = useState(homeTabs)
  const unselectedItems = useMemo(() => {
    const allSelectedTabKeys = new Set(selectedItems.map(tab => tab.key))
    return allHomeTabs.filter(tab => !allSelectedTabKeys.has(tab.key))
  }, [selectedItems])
  const [tabIndex, setTabIndex] = useAtom(homeTabIndexAtom)
  const [isEdit, setIsEdit] = useState(false)

  function renderItem({
    item,
    iconName,
    onIconPress,
  }: {
    item: HomeTab
    iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
    onIconPress?: () => void
  }) {
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
  }

  useAtomValue(colorSchemeAtom)

  return (
    <SafeAreaView edges={['top']} style={tw`flex-1`}>
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
          {isEdit && (
            <Pressable
              onPress={() => {
                setSelectedItems(allHomeTabs)
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
                const nextTabIndex = findIndex(selectedItems, {
                  key: homeTabs[tabIndex]?.key,
                })
                setTabIndex(nextTabIndex > -1 ? nextTabIndex : 0)
                setHomeTabs(selectedItems)
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
        {unselectedItems.map(item => (
          <Pressable
            style={tw`mt-2.5`}
            key={item.key}
            onPress={() => {
              setSelectedItems([...selectedItems, item])
            }}
          >
            {renderItem({
              item,
              iconName: 'plus-circle',
            })}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  )
}
