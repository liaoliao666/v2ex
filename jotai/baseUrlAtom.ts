import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const v2exURL = `https://www.v2ex.com`

export const baseURLAtom = atomWithAsyncStorage<string>('baseUrl', v2exURL)
