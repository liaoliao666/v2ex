import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import {
  FlatList,
  ListRenderItem,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import BottomSheet from '@/components/BottomSheet'
import Empty from '@/components/Empty'
import { LineSeparator } from '@/components/Separator'
import { uiAtom } from '@/jotai/uiAtom'
import { getCurrentRouteName, navigation } from '@/navigation/navigationRef'
import { isTablet } from '@/utils/tablet'
import { BlockedTopic } from '@/utils/topicBlocking'
import tw from '@/utils/tw'

import TopicItem from './TopicItem'

export default function BlockedTopicsSheet({
  visible,
  sourceTitle,
  blockedTopics,
  onClose,
}: {
  visible: boolean
  sourceTitle: string
  blockedTopics: BlockedTopic[]
  onClose: () => void
}) {
  const { height } = useWindowDimensions()
  const subtitle = `${sourceTitle} · 已屏蔽 ${blockedTopics.length} 个主题`

  const renderItem: ListRenderItem<BlockedTopic> = useMemo(
    () =>
      ({ item }) =>
        (
          <TopicItem
            topic={item.topic}
            blockReason={`命中：${item.reasonText}`}
            onPress={() => {
              onClose()
              requestAnimationFrame(() => {
                if (isTablet() && getCurrentRouteName() === 'TopicDetail') {
                  navigation.replace('TopicDetail', item.topic)
                } else {
                  navigation.push('TopicDetail', item.topic)
                }
              })
            }}
          />
        ),
    [onClose]
  )

  return (
    <BottomSheet
      visible={visible}
      title="已屏蔽主题"
      subtitle={subtitle}
      onClose={onClose}
    >
      <FlatList
        style={{ maxHeight: height * 0.9 - 92 }}
        data={blockedTopics}
        keyExtractor={item => item.topic.id.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={LineSeparator}
        ListFooterComponent={<SafeAreaView edges={['bottom']} />}
        ListEmptyComponent={<BlockedTopicsEmpty />}
      />
    </BottomSheet>
  )
}

function BlockedTopicsEmpty() {
  const { colors, fontSize } = useAtomValue(uiAtom)
  return (
    <View style={tw`py-8`}>
      <Empty description="暂无屏蔽主题" />
      <Text
        style={tw`text-[${colors.default}] ${fontSize.small} text-center px-4 mt-2`}
      >
        当前列表没有命中本地规则的主题
      </Text>
    </View>
  )
}
