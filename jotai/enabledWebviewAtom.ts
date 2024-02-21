import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const enabledWebviewAtom = atomWithAsyncStorage('enabledWebview', true)
