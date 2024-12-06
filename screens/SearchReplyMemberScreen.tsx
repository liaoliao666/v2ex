import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { uniqBy, upperCase } from 'lodash-es'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import BouncyCheckbox from 'react-native-bouncy-checkbox'
import { SafeAreaView } from 'react-native-safe-area-context'

import Empty from '@/components/Empty'
import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import SearchBar from '@/components/SearchBar'
import { LineSeparator } from '@/components/Separator'
import StyledImage from '@/components/StyledImage'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Reply, k } from '@/servicies'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SearchReplyMemberScreen() {
  const { params } =
    useRoute<RouteProp<RootStackParamList, 'SearchReplyMember'>>()

  const { data } = k.topic.detail.useInfiniteQuery({
    variables: { id: params.topicId },
    enabled: false,
  })

  const [searchText, setSearchText] = useState('')

  const flatedData = useMemo(
    () =>
      uniqBy(data?.pages.map(page => page.replies).flat() || [], 'id').filter(
        reply =>
          upperCase(reply.member.username).includes(upperCase(searchText)) ||
          upperCase(reply.content).includes(upperCase(searchText))
      ),
    [data?.pages, searchText]
  )

  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set())

  const handleReplyChange = useCallback(
    ({ checked, reply }: { checked: boolean; reply: Reply }) => {
      setCheckedIds(prev => {
        const copyCheckedIds = new Set(prev)
        copyCheckedIds[checked ? 'add' : 'delete'](reply.id)
        return new Set(copyCheckedIds)
      })
    },
    []
  )

  const renderNodeItem: ListRenderItem<Reply> = useCallback(
    ({ item }) => (
      <AtReplyItem
        key={item.id}
        reply={item}
        checked={checkedIds.has(item.id)}
        onChange={handleReplyChange}
      />
    ),
    [checkedIds, handleReplyChange]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  const { colors, fontSize } = useAtomValue(uiAtom)

  const inputRef = useRef<TextInput>(null)

  return (
    <SafeAreaView edges={['bottom']} style={tw`bg-[${colors.base100}] flex-1`}>
      <NavBar
        hideSafeTop
        left={null}
        right={
          <TouchableOpacity
            onPress={() => {
              const toReply = Object.fromEntries(
                flatedData.map(item => [item.id, item])
              )

              params.onAtNames(
                [
                  ...new Set(
                    [...checkedIds].map(
                      id => `@${toReply[id]?.member.username}`
                    )
                  ),
                ].join(' ')
              )
              navigation.goBack()
            }}
          >
            <Text style={tw`text-[${colors.primary}] ${fontSize.medium}`}>
              确定
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
          placeholder="搜索用户或回复"
        />
      </NavBar>

      <FlatList
        key={colorScheme}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        data={flatedData}
        renderItem={renderNodeItem}
        ListEmptyComponent={<Empty description="暂无搜索结果" />}
        ItemSeparatorComponent={LineSeparator}
        onScrollBeginDrag={() => {
          inputRef.current?.blur()
        }}
      />
    </SafeAreaView>
  )
}

const AtReplyItem = memo(
  ({
    reply,
    onChange,
    checked,
  }: {
    reply: Reply
    onChange: (info: { checked: boolean; reply: Reply }) => void
    checked: boolean
  }) => {
    const { colors, fontSize } = useAtomValue(uiAtom)

    return (
      <TouchableOpacity
        style={tw`px-4 py-3 flex-row`}
        onPress={() => {
          onChange({
            reply,
            checked: !checked,
          })
        }}
      >
        <StyledImage
          style={tw`w-5 h-5 rounded-full`}
          source={reply.member.avatar}
        />
        <View style={tw`flex-1 mx-2`}>
          <View style={tw`flex-row items-center`}>
            <Text
              style={tw`text-[${colors.foreground}] ${fontSize.medium} font-medium`}
            >
              {reply.member.username}
            </Text>
            <Text style={tw`${fontSize.small} text-[${colors.default}] ml-2`}>
              #{reply.no}
            </Text>
          </View>

          <View style={tw`pt-0.5`} pointerEvents="none">
            <Html
              source={{
                html: reply.content,
              }}
              inModalScreen
              paddingX={32 + 36}
            />
          </View>
        </View>
        <BouncyCheckbox
          isChecked={checked}
          size={20}
          fillColor={tw`text-[${colors.primary}]`.color as string}
          unfillColor={tw`dark:text-[#0f1419] text-white`.color as string}
          disableBuiltInState
        />
      </TouchableOpacity>
    )
  }
)
