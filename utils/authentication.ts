import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { getNavigation } from '@/navigation/navigationRef'

export function validateLoginStatus() {
  if (!store.get(profileAtom)) {
    getNavigation()?.navigate('Login')
    throw new Error('LoginStatus is invalidation')
  }
}
