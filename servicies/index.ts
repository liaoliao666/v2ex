import { authService } from './auth'
import { imageService } from './image'
import { memberService } from './member'
import { myService } from './my'
import { notificationService } from './notification'
import { replyService } from './reply'
import { settingService } from './settings'
import { topService } from './top'
import { topicService } from './topic'

export const k = {
  auth: authService,
  image: imageService,
  member: memberService,
  my: myService,
  notification: notificationService,
  reply: replyService,
  setting: settingService,
  top: topService,
  topic: topicService,
}
