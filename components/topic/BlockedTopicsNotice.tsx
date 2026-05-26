import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { Pressable, Text } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'
import { BlockedTopic } from '@/utils/topicBlocking'
import tw from '@/utils/tw'

import BlockedTopicsSheet from './BlockedTopicsSheet'

export default function BlockedTopicsNotice({
  blockedTopics,
  sourceTitle,
}: {
  blockedTopics: BlockedTopic[]
  sourceTitle: string
}) {
  const [visible, setVisible] = useState(false)
  const { colors, fontSize } = useAtomValue(uiAtom)

  if (!blockedTopics.length) return null

  return (
    <>
      <Pressable
        style={({ pressed }) =>
          tw.style(
            `mx-4 my-2 px-3 py-2 rounded-lg bg-[${colors.base200}] flex-row items-center`,
            pressed && `opacity-80`
          )
        }
        onPress={() => setVisible(true)}
      >
        <MaterialCommunityIcons
          name="eye-off-outline"
          size={18}
          color={colors.default}
        />
        <Text style={tw`ml-2 text-[${colors.default}] ${fontSize.small}`}>
          已屏蔽 {blockedTopics.length} 个主题
        </Text>
        <Text
          style={tw`ml-auto text-[${colors.primary}] ${fontSize.small} font-medium`}
        >
          查看
        </Text>
      </Pressable>

      <BlockedTopicsSheet
        visible={visible}
        sourceTitle={sourceTitle}
        blockedTopics={blockedTopics}
        onClose={() => setVisible(false)}
      />
    </>
  )
}
