import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'

export function isSignined() {
  return !!store.get(profileAtom)
}

export function isSelf(username?: string) {
  return store.get(profileAtom)?.username === username
}
