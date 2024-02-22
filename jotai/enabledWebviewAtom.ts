import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

/**
 * 打开链接时是否启用内置浏览器
 */
export const enabledWebviewAtom = atomWithAsyncStorage('enabledWebview', true)
