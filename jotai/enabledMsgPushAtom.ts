import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 是否启动消息推送
 */
export const enabledMsgPushAtom = atomWithAsyncStorage<boolean>(
  'enabledMsgPush',
  true
)
