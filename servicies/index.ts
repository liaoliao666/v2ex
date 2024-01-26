import { authRouter } from './auth'
import { memberRouter } from './member'
import { myRouter } from './my'
import { nodeRouter } from './node'
import { notificationRouter } from './notification'
import { otherRouter } from './other'
import { replyRouter } from './reply'
import { settingsRouter } from './settings'
import { topRouter } from './top'
import { topicRouter } from './topic'

export * from './types'

export const k = {
  auth: authRouter,
  other: otherRouter,
  member: memberRouter,
  my: myRouter,
  node: nodeRouter,
  notification: notificationRouter,
  reply: replyRouter,
  settings: settingsRouter,
  top: topRouter,
  topic: topicRouter,
}
