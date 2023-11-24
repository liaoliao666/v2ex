import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const v2exURL = `https://www.v2ex.com`

export const baseUrlAtom = atomWithAsyncStorage('baseUrl', v2exURL)
