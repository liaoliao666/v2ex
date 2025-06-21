import AntDesign from 'react-native-vector-icons/AntDesign'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { isEqual, isUndefined, maxBy } from 'lodash-es'
import { memo, useCallback, useState } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import DebouncedPressable from '@/components/DebouncedPressable'
import Empty from '@/components/Empty'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import { LineSeparator } from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import TopicPlaceholder from '@/components/placeholder/TopicPlaceholder'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Topic, k } from '@/servicies'
import tw from '@/utils/tw'
import { useQueryData } from '@/utils/useQueryData'

const TAB_BAR_HEIGHT = 40

export default withQuerySuspense(HotestTopicsScreen, {
  LoadingComponent: () => (
    <View style={tw`flex-1`}>
      <NavBar title="历史最热" />
      <TopicPlaceholder />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="历史最热" />
      <FallbackComponent {...props} />
    </View>
  ),
})

const MemoHotestTopics = withQuerySuspense(memo(HotestTopics), {
  FallbackComponent: props => {
    const headerHeight = useNavBarHeight()
    return (
      <View style={{ paddingTop: headerHeight }}>
        <FallbackComponent {...props} />
      </View>
    )
  },
  LoadingComponent: () => {
    const headerHeight = useNavBarHeight()
    return (
      <View style={{ paddingTop: headerHeight }}>
        <TopicPlaceholder hideAvatar />
      </View>
    )
  },
})

function HotestTopicsScreen() {
  const [date, setDate] = useState(dayjs().subtract(1, 'day').toDate())

  const headerHeight = useNavBarHeight()

  const { colors, fontSize } = useAtomValue(uiAtom)

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)

  const iconSize = tw.style(fontSize.small).fontSize as number

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />

        <NavBar
          title="历史最热"
          style={tw`border-b-0`}
          right={
            <View style={tw`flex-row items-center`}>
              {dayjs(date).isBefore('2018-08-06') ? (
                <AntDesign
                  name="caretleft"
                  size={iconSize}
                  color={colors.foreground}
                  style={tw`opacity-50 p-2`}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setDate(dayjs(date).subtract(1, 'day').toDate())
                  }}
                >
                  <AntDesign
                    style={tw`p-2`}
                    name="caretleft"
                    size={iconSize}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setDatePickerVisibility(true)
                }}
              >
                <Text
                  style={tw.style(
                    fontSize.medium,
                    `text-[${colors.primary}] font-medium`
                  )}
                >
                  {dayjs(date).format('YYYY-MM-DD')}
                </Text>
              </TouchableOpacity>
              {dayjs(date).isAfter(dayjs().subtract(2, 'day')) ? (
                <AntDesign
                  name="caretright"
                  size={iconSize}
                  color={colors.foreground}
                  style={tw`opacity-50 p-2 -mr-2`}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setDate(dayjs(date).add(1, 'day').toDate())
                  }}
                >
                  <AntDesign
                    style={tw`p-2 -mr-2`}
                    name="caretright"
                    size={iconSize}
                    color={colors.foreground}
                  />
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      <MemoHotestTopics
        headerHeight={headerHeight}
        date={dayjs(date).format('YYYY-MM-DD')}
      />

      <DateTimePickerModal
        // textColor={colors.default}
        accentColor={colors.foreground}
        themeVariant={colorScheme}
        isDarkModeEnabled={colorScheme === 'dark'}
        // pickerContainerStyleIOS={{ backgroundColor: colors.base200 }}
        // pickerStyleIOS={{ backgroundColor: colors.base200 }}
        buttonTextColorIOS={colors.primary}
        confirmTextIOS="确定"
        cancelTextIOS="取消"
        isVisible={isDatePickerVisible}
        mode="date"
        display="inline"
        locale="zh-CN"
        minimumDate={dayjs('2018-08-05').toDate()}
        maximumDate={dayjs().subtract(1, 'day').toDate()}
        onConfirm={d => {
          setDate(d)
          setDatePickerVisibility(false)
        }}
        onCancel={() => {
          setDatePickerVisibility(false)
        }}
        date={date}
      />
    </View>
  )
}

function HotestTopics({
  headerHeight,
  date,
}: {
  date: string
  headerHeight: number
}) {
  const { data } = k.topic.hotest.useSuspenseQuery({
    variables: { date },
  })

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <HotestItem key={item.id} topic={item} />,
    []
  )

  return (
    <FlatList
      data={data}
      contentContainerStyle={{
        paddingTop: headerHeight,
      }}
      ItemSeparatorComponent={LineSeparator}
      ListFooterComponent={<SafeAreaView edges={['bottom']} />}
      renderItem={renderItem}
      ListEmptyComponent={<Empty description="目前还没有主题" />}
    />
  )
}

const HotestItem = memo(({ topic }: { topic: Topic }) => {
  const isReaded = useQueryData(
    k.topic.detail.getKey({ id: topic.id }),
    data => {
      if (isUndefined(data)) return false
      const replyCount = maxBy(data.pages, 'reply_count')?.reply_count || 0
      return replyCount >= topic.reply_count
    }
  )
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <DebouncedPressable
      style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}
      onPress={() => {
        navigation.push('TopicDetail', topic)
      }}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row gap-2`}>
          {!!topic.node?.title && (
            <StyledButton
              size="mini"
              type="tag"
              onPress={() => {
                navigation.push('NodeTopics', {
                  name: topic.node?.name!,
                })
              }}
            >
              {topic.node?.title}
            </StyledButton>
          )}
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.medium} font-semibold flex-shrink`}
            numberOfLines={1}
            onPress={() => {
              navigation.push('MemberDetail', {
                username: topic.member?.username!,
              })
            }}
          >
            {topic.member?.username}
          </Text>
        </View>

        <Text
          style={tw.style(
            `${fontSize.medium} font-medium pt-2`,
            isReaded
              ? `text-[${colors.default}]`
              : `text-[${colors.foreground}]`
          )}
        >
          {topic.title}
        </Text>
      </View>
    </DebouncedPressable>
  )
}, isEqual)
