import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'

export function isSignined() {
  return !!store.get(profileAtom)
}
