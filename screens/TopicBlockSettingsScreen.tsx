import { Feather, MaterialIcons } from '@expo/vector-icons'
import { useAtom, useAtomValue } from 'jotai'
import { uniqBy } from 'lodash-es'
import { ReactNode, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Empty from '@/components/Empty'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import RemovableChip from '@/components/RemovableChip'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import {
  blockedNodeNamesAtom,
  topicTitleBlockKeywordsAtom,
} from '@/jotai/blockKeywordsAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Node, k } from '@/servicies'
import { confirm } from '@/utils/confirm'
import {
  normalizeKeyword,
  normalizeKeywordForMatch,
  normalizeNodeName,
} from '@/utils/topicBlocking'
import tw from '@/utils/tw'

export default function TopicBlockSettingsScreen() {
  const [keywords, setKeywords] = useAtom(topicTitleBlockKeywordsAtom)
  const [blockedNodeNames, setBlockedNodeNames] = useAtom(blockedNodeNamesAtom)
  const [keywordInput, setKeywordInput] = useState('')
  const { colors, fontSize } = useAtomValue(uiAtom)
  const navbarHeight = useNavBarHeight()

  const { data: allNodes = [] } = k.node.all.useQuery()
  const nodeMap = useMemo(
    () => Object.fromEntries(allNodes.map(node => [node.name, node])),
    [allNodes]
  )

  function addKeyword() {
    const keyword = normalizeKeyword(keywordInput)
    if (!keyword) return

    if (
      keywords.some(
        item =>
          normalizeKeywordForMatch(item) === normalizeKeywordForMatch(keyword)
      )
    ) {
      Toast.show({
        type: 'info',
        text1: '关键字已存在',
      })
      return
    }

    setKeywords(prev => [...prev, keyword])
    setKeywordInput('')
  }

  async function clearKeywords() {
    if (!keywords.length) return
    try {
      await confirm('清空标题关键字？', '清空后对应主题会重新显示')
      setKeywords([])
    } catch {}
  }

  async function clearNodes() {
    if (!blockedNodeNames.length) return
    try {
      await confirm('清空屏蔽节点？', '清空后这些节点的主题会重新显示')
      setBlockedNodeNames([])
    } catch {}
  }

  function saveSelectedNodes(nodes: Node[]) {
    setBlockedNodeNames(
      uniqBy(
        nodes
          .map(node => node.name)
          .map(normalizeNodeName)
          .filter(Boolean),
        nodeName => nodeName
      )
    )
  }

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <SettingsSection
          title="标题关键字"
          description="手动输入关键字，隐藏标题命中的主题"
          action={
            keywords.length ? (
              <Pressable onPress={clearKeywords}>
                <Text style={tw`text-[${colors.primary}] ${fontSize.medium}`}>
                  清空
                </Text>
              </Pressable>
            ) : null
          }
        >
          <View style={tw`flex-row gap-2`}>
            <TextInput
              style={tw`flex-1 h-10 px-3 rounded-lg bg-[${colors.base200}] text-[${colors.foreground}] ${fontSize.medium}`}
              placeholder="输入标题关键字"
              placeholderTextColor={colors.default}
              value={keywordInput}
              onChangeText={setKeywordInput}
              onSubmitEditing={addKeyword}
              returnKeyType="done"
            />
            <StyledButton size="small" type="primary" onPress={addKeyword}>
              添加
            </StyledButton>
          </View>

          {keywords.length ? (
            <View style={tw`flex-row flex-wrap gap-2 mt-3`}>
              {keywords.map(keyword => (
                <RemovableChip
                  key={keyword}
                  label={keyword}
                  onRemove={() =>
                    setKeywords(prev => prev.filter(item => item !== keyword))
                  }
                />
              ))}
            </View>
          ) : (
            <Empty description="暂无屏蔽关键字" />
          )}
        </SettingsSection>

        <SettingsSection
          title="屏蔽节点"
          description="从全部节点中选择，隐藏这些节点下的主题"
          action={
            blockedNodeNames.length ? (
              <Pressable onPress={clearNodes}>
                <Text style={tw`text-[${colors.primary}] ${fontSize.medium}`}>
                  清空
                </Text>
              </Pressable>
            ) : null
          }
        >
          <StyledButton
            size="small"
            type="primary"
            onPress={() => {
              navigation.navigate('SearchNode', {
                multiple: true,
                selectedNodeNames: blockedNodeNames,
                onSelectNodes: saveSelectedNodes,
              })
            }}
            icon={<MaterialIcons name="add" size={18} />}
          >
            添加节点
          </StyledButton>

          {blockedNodeNames.length ? (
            <View style={tw`flex-row flex-wrap gap-2 mt-3`}>
              {blockedNodeNames.map(nodeName => (
                <RemovableChip
                  key={nodeName}
                  label={getNodeLabel(nodeMap[nodeName], nodeName)}
                  onRemove={() =>
                    setBlockedNodeNames(prev =>
                      prev.filter(item => item !== nodeName)
                    )
                  }
                />
              ))}
            </View>
          ) : (
            <Empty description="暂无屏蔽节点" />
          )}
        </SettingsSection>

        <SafeAreaView edges={['bottom']} />
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          title="主题屏蔽"
          right={<Feather name="slash" size={20} color={colors.foreground} />}
        />
      </View>
    </View>
  )
}

function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`px-4 py-4`}>
      <View style={tw`flex-row items-center mb-3`}>
        <View style={tw`flex-1`}>
          <Text
            style={tw`text-[${colors.foreground}] ${fontSize.large} font-semibold`}
          >
            {title}
          </Text>
          <Text style={tw`text-[${colors.default}] ${fontSize.small} mt-1`}>
            {description}
          </Text>
        </View>
        {action}
      </View>

      {children}
    </View>
  )
}

function getNodeLabel(node: Node | undefined, fallbackName: string) {
  if (!node) return fallbackName
  if (node.title === node.name) return node.name
  return `${node.title} / ${node.name}`
}
