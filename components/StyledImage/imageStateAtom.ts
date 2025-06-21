import { atom } from 'jotai'

export interface ImageState {
  isLoading: boolean
  hasError: boolean
}

// 创建一个 atom 来管理所有图片状态
export const imageStateAtom = atom<Map<string, ImageState>>(new Map())

// 创建一个 atom 来获取和设置特定 URI 的状态
export const createImageStateAtom = (uri: string) => {
  return atom(
    (get) => {
      const stateMap = get(imageStateAtom)
      return stateMap.get(uri) || { isLoading: false, hasError: false }
    },
    (get, set, state: Partial<ImageState>) => {
      const stateMap = get(imageStateAtom)
      const currentState = stateMap.get(uri) || { isLoading: false, hasError: false }
      const newState = { ...currentState, ...state }
      const newMap = new Map(stateMap)
      newMap.set(uri, newState)
      set(imageStateAtom, newMap)
    }
  )
} 