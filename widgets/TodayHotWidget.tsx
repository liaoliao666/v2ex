import { Divider, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui'
import {
  background,
  containerBackground,
  font,
  foregroundStyle,
  lineLimit,
  minimumScaleFactor,
  padding,
  shapes,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers'
import { type WidgetEnvironment, createWidget } from 'expo-widgets'

export type TodayHotWidgetProps = {
  topics?: {
    id: number
    title: string
    username: string
    nodeTitle: string
    replyCount: number
    lastTouched: string
  }[]
}

function TodayHotWidgetView(
  props: TodayHotWidgetProps,
  environment: WidgetEnvironment
) {
  'widget'

  const isSmall = environment.widgetFamily === 'systemSmall'
  const isLarge = environment.widgetFamily === 'systemLarge'
  const topicLimit = isLarge ? 4 : isSmall ? 1 : 2
  const titleLines = isSmall ? 3 : isLarge ? 2 : 1
  const topics = (props.topics ?? []).slice(0, topicLimit)
  const widgetDestination =
    isSmall && topics[0] ? `v2fun://topic/${topics[0].id}` : 'v2fun:///'
  const isDark = environment.colorScheme === 'dark'
  const base100 = isDark ? '#262626' : '#FFFFFF'
  const base200 = isDark ? '#202327' : '#EFF3F4'
  const foreground = isDark ? '#DBDBDB' : '#0F1419'
  const secondary = isDark ? '#808080' : '#536471'
  const primary = '#1D9BF0'
  const renderTopic = (topic: (typeof topics)[number], index: number) => (
    <VStack key={String(topic.id)} alignment="leading" spacing={0}>
      {index > 0 ? <Divider /> : null}
      <VStack
        alignment="leading"
        spacing={4}
        modifiers={[padding({ vertical: 6 })]}
      >
        <Text
          modifiers={[
            font({
              size: isSmall ? 14 : 13,
              weight: 'semibold',
            }),
            foregroundStyle(foreground),
            lineLimit(titleLines),
            minimumScaleFactor(0.8),
          ]}
        >
          {topic.title}
        </Text>
        <HStack spacing={6}>
          <Text
            modifiers={[
              font({ size: 10 }),
              foregroundStyle(secondary),
              lineLimit(1),
            ]}
          >
            {topic.username}
          </Text>
          {!isSmall && topic.nodeTitle ? (
            <Text
              modifiers={[
                font({ size: 9, weight: 'medium' }),
                foregroundStyle(primary),
                padding({ horizontal: 5, vertical: 1 }),
                background(base200, shapes.capsule()),
                lineLimit(1),
              ]}
            >
              {topic.nodeTitle}
            </Text>
          ) : null}
          <Spacer />
          <Text
            modifiers={[
              font({ size: 10 }),
              foregroundStyle(secondary),
              lineLimit(1),
            ]}
          >
            {topic.replyCount > 0
              ? `${topic.replyCount} 回复`
              : topic.lastTouched}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  )

  return (
    <VStack
      alignment="leading"
      spacing={0}
      modifiers={[
        containerBackground(base100, 'widget'),
        widgetURL(widgetDestination),
      ]}
    >
      <HStack spacing={6} modifiers={[padding({ bottom: 6 })]}>
        <Image systemName="flame.fill" size={14} color={primary} />
        <Text
          modifiers={[
            font({ size: 14, weight: 'bold' }),
            foregroundStyle(foreground),
          ]}
        >
          今日最热
        </Text>
        <Spacer />
        {!isSmall ? (
          <Text
            date={environment.date}
            dateStyle="time"
            modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}
          />
        ) : null}
      </HStack>

      {topics.length === 0 ? (
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundStyle(secondary),
            lineLimit(2),
          ]}
        >
          打开 V2Fun 获取今日最热主题
        </Text>
      ) : null}
      {topics[0] ? renderTopic(topics[0], 0) : null}
      {topics[1] ? renderTopic(topics[1], 1) : null}
      {topics[2] ? renderTopic(topics[2], 2) : null}
      {topics[3] ? renderTopic(topics[3], 3) : null}
    </VStack>
  )
}

export default createWidget<TodayHotWidgetProps>(
  'TodayHotWidget',
  TodayHotWidgetView
)
