import { auth } from './auth'
import { member } from './member'
import { my } from './my'
import { node } from './node'
import { notification } from './notification'
import { other } from './other'
import { reply } from './reply'
import { settings } from './settings'
import { top } from './top'
import { topic } from './topic'

export * from './types'

export const k = {
  auth,
  other,
  member,
  my,
  node,
  notification,
  reply,
  settings,
  top,
  topic,
}
