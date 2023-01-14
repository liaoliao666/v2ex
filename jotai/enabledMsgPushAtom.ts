import { atomWithStorage } from 'jotai/utils'

import { storage } from './storage'

/**
 * 是否启动消息推送
 */
export const enabledMsgPushAtom = atomWithStorage<boolean>(
  'enabledMsgPush',
  true,
  storage
)
