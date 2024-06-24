export interface PageData<T> {
  page: number
  last_page: number
  list: T[]
}

export interface Profile {
  username: string
  avatar: string
  motto?: string
  gold?: number
  silver?: number
  bronze?: number
  my_nodes?: number
  my_topics?: number
  my_following?: number
  my_notification?: number
  once?: string
}

export interface Member {
  id?: number
  username: string
  website?: string
  twitter?: string
  psn?: string
  github?: string
  telegram?: string
  btc?: string
  location?: string
  tagline?: string
  bio?: string
  avatar?: string
  status?: string
  created?: string
  activity?: number
  online?: boolean
  motto?: string
  widgets?: {
    uri: string
    title: string
    link: string
  }[]
  gold?: number
  silver?: number
  bronze?: number
  company?: string
  title?: string
  overview?: string
  blocked?: boolean
  followed?: boolean
  cost?: string
  once?: string
}

export interface Node {
  avatar_large?: string
  name: string
  avatar_normal?: string
  title: string
  url?: string
  topics?: number
  footer?: string
  header?: string
  title_alternative?: string
  avatar_mini?: string
  stars?: number
  aliases?: string[]
  root?: boolean
  id?: number
  parent_node_name?: string
  last_modified?: number
  created?: number
}

export interface Supplement {
  content: string
  parsed_content?: string
  created: string
}

export interface Reply {
  id: number
  no: number
  content: string
  parsed_content?: string
  created: string
  member: {
    username: string
    avatar: string
  }
  thanks: number
  thanked: boolean
  mod?: boolean
  op?: boolean
  has_related_replies?: boolean
}

export interface Topic {
  node?: {
    name: string
    title: string
  }
  member?: Member
  created?: string
  last_reply_by?: string
  last_touched?: string
  title: string
  content: string
  parsed_content?: string
  last_modified?: string
  replies: Reply[]
  votes: number
  reply_count: number
  supplements: Supplement[]
  liked?: boolean
  ignored?: boolean
  once?: string
  thanked: boolean
  views: number
  likes: number
  thanks: number
  id: number
  pin_to_top?: boolean
  editable?: boolean
  appendable?: boolean
}

export interface Xna {
  node?: {
    name: string
    title: string
  }
  member?: Member
  created?: string
  last_reply_by?: string
  last_touched?: string
  title: string
  content: string
  id: string
  pin_to_top?: boolean
}

export interface Notice {
  prev_action_text: string
  next_action_text: string
  created: string
  content: string | null
  member: Member
  topic: Topic
  id: number
  once: string
}

export interface Sov2exResult {
  took: number
  total: number
  hits: {
    _score?: any
    _index: string
    _type: string
    _id: string
    sort: any[]
    highlight: {
      'reply_list.content': string[]
      title: string[]
      content: string[]
    }
    _source: {
      node: number
      replies: number
      created: Date
      member: string
      id: number
      title: string
      content: string
    }
  }[]
  timed_out: boolean
  from: number
  size: number
}
