export type ReplyReference = {
  username: string
  replyNo?: number
}

const REPLY_REFERENCES_CACHE_LIMIT = 2000
const replyReferencesCache = new Map<string, ReplyReference[]>()

export function getReplyReferences(replyContent: string): ReplyReference[] {
  const cachedReferences = replyReferencesCache.get(replyContent)
  if (cachedReferences) return cachedReferences

  const references: ReplyReference[] = []
  const seenKeys = new Set<string>()
  const htmlAtPattern = /@<a href="\/member\/(.+?)">.*?<\/a>\s*(?:#(\d+))?/g
  const textAtPattern = /@([A-Za-z0-9_]+)\s*(?:#(\d+))?/g

  function addReference(username: string, replyNo?: string) {
    const reference = {
      username,
      replyNo: replyNo ? Number(replyNo) : undefined,
    }
    const key = `${reference.username}:${reference.replyNo ?? ''}`
    if (seenKeys.has(key)) return

    seenKeys.add(key)
    references.push(reference)
  }

  let match = htmlAtPattern.exec(replyContent)
  while (match) {
    addReference(match[1], match[2])
    match = htmlAtPattern.exec(replyContent)
  }

  const textContent = replyContent.replace(/<[^>]*>/g, '')
  match = textAtPattern.exec(textContent)
  while (match) {
    addReference(match[1], match[2])
    match = textAtPattern.exec(textContent)
  }

  if (replyReferencesCache.size >= REPLY_REFERENCES_CACHE_LIMIT) {
    const firstKey = replyReferencesCache.keys().next().value
    if (firstKey !== undefined) replyReferencesCache.delete(firstKey)
  }
  replyReferencesCache.set(replyContent, references)
  return references
}

export function getAtNameList(replyContent: string) {
  return new Set(
    getReplyReferences(replyContent).map(reference => reference.username)
  )
}

export function hasExplicitReplyReference(
  replyContent: string,
  username: string,
  replyNo: number
) {
  return getReplyReferences(replyContent).some(
    reference =>
      reference.replyNo === replyNo && reference.username === username
  )
}
