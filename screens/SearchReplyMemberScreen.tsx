import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { uniqBy, upperCase } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'
import BouncyCheckbox from 'react-native-bouncy-checkbox'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

import Empty from '@/components/Empty'
import Html from '@/components/Html'
import NavBar from '@/components/NavBar'
import SearchBar from '@/components/SearchBar'
import { LineSeparator } from '@/components/Separator'
import StyledImage from '@/components/StyledImage'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Reply } from '@/servicies/types'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

export default function SearchReplyMemberScreen() {
  const { params } =
    useRoute<RouteProp<RootStackParamList, 'SearchReplyMember'>>()

  const { data } = useTopicDetail({
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

  const navigation = useNavigation()

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

  return (
    <View style={tw`bg-body-1 flex-1`}>
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
                [...checkedIds]
                  .map(id => `@${toReply[id]?.member.username}`)
                  .join(' ')
              )
              navigation.goBack()
            }}
          >
            <Text style={tw`text-secondary ${getFontSize(5)}`}>确定</Text>
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
          placeholder="搜索用户或回复"
        />
      </NavBar>

      <FlatList
        key={colorScheme}
        removeClippedSubviews={true}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        data={flatedData}
        renderItem={renderNodeItem}
        ListEmptyComponent={<Empty description="暂无搜索结果" />}
        ItemSeparatorComponent={LineSeparator}
      />
    </View>
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
    return (
      <View style={tw`px-4 py-3 flex-row`}>
        <StyledImage
          style={tw`w-5 h-5 rounded-full`}
          source={{
            uri: reply.member.avatar,
          }}
        />
        <View style={tw`flex-1 mx-2`}>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-tint-primary ${getFontSize(5)} font-medium`}>
              {reply.member.username}
            </Text>
            <Text style={tw`${getFontSize(6)} text-tint-secondary ml-2`}>
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
          fillColor={tw`text-secondary`.color as string}
          unfillColor={tw`dark:text-[#0f1419] text-white`.color as string}
          onPress={() => {
            onChange({
              reply,
              checked: !checked,
            })
          }}
        />
      </View>
    )
  }
)
