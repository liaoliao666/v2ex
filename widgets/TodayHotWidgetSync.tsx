import { useEffect } from 'react'
import { Platform } from 'react-native'

import { k } from '@/servicies'
import { isExpoGo } from '@/utils/isExpoGo'
import { useTopicBlockRules } from '@/utils/useTopicBlockRules'

import type { TodayHotWidgetProps } from './TodayHotWidget'

type TodayHotWidgetInstance = typeof import('./TodayHotWidget')['default']

let todayHotWidget: TodayHotWidgetInstance | undefined

if (Platform.OS === 'ios' && !isExpoGo) {
  try {
    todayHotWidget = require('./TodayHotWidget').default
  } catch {
    todayHotWidget = undefined
  }
}

export default function TodayHotWidgetSync() {
  const { data } = k.topic.tab.useQuery({
    variables: { tab: 'hot' },
    enabled: !!todayHotWidget,
    refetchOnWindowFocus: true,
  })
  const { visibleTopics } = useTopicBlockRules(data ?? [])

  useEffect(() => {
    if (!todayHotWidget || data === undefined) return

    const props: TodayHotWidgetProps = {
      topics: visibleTopics.slice(0, 4).map(topic => ({
        id: topic.id,
        title: topic.title,
        username: topic.member?.username || '',
        nodeTitle: topic.node?.title || '',
        replyCount: topic.reply_count || 0,
        lastTouched: topic.last_touched || '',
      })),
    }

    todayHotWidget.updateSnapshot(props)
  }, [data, visibleTopics])

  return null
}
