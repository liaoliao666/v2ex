import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { uniqBy, upperCase } from 'lodash-es'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import NavBar, { NAV_BAR_HEIGHT } from '@/components/NavBar'
import SearchBar from '@/components/SearchBar'
import StyledImage from '@/components/StyledImage'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useTopicDetail } from '@/servicies/topic'
import { Member } from '@/servicies/types'
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

  const matchReplyMembers = useMemo(() => {
    const members = uniqBy(
      data?.pages.map(page => page.replies.map(reply => reply.member)).flat() ||
        [],
      'username'
    )
    return searchText
      ? members.filter(member =>
          upperCase(member.username).includes(upperCase(searchText))
        )
      : members
  }, [data, searchText])

  const navigation = useNavigation()

  const handlePressReplyMemberItem = useCallback((replyMember: Member) => {
    navigation.goBack()
    params.onPressReplyMemberItem(replyMember)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderNodeItem: ListRenderItem<Member> = useCallback(
    ({ item }) => (
      <MemberItem
        key={item.username}
        member={item}
        onPressMember={handlePressReplyMemberItem}
      />
    ),
    [handlePressReplyMemberItem]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <NavBar hideSafeTop left={null}>
        <SearchBar
          style={tw`flex-1`}
          value={searchText}
          onChangeText={text => {
            setSearchText(text.trim())
          }}
          autoFocus
          placeholder="搜索用户"
        />
      </NavBar>

      <FlatList
        removeClippedSubviews
        key={colorScheme}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        data={matchReplyMembers}
        renderItem={renderNodeItem}
      />
    </View>
  )
}

const MemberItem = memo(
  ({
    member,
    onPressMember,
  }: {
    member: Member
    onPressMember: (member: Member) => void
  }) => {
    return (
      <Pressable
        style={({ pressed }) =>
          tw.style(
            `h-[${NAV_BAR_HEIGHT}px] px-4 flex-row items-center`,
            pressed && `bg-message-press`
          )
        }
        onPress={() => {
          onPressMember(member)
        }}
      >
        <StyledImage
          style={tw`w-5 h-5 rounded-full`}
          source={{
            uri: member.avatar,
          }}
        />
        <Text style={tw`text-body-5 text-tint-secondary ml-2`}>
          {member.username}
        </Text>
      </Pressable>
    )
  }
)
