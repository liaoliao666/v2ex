import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export const imgurConfigAtom = atomWithAsyncStorage<{
  clientId?: string
  uploadedFiles: Record<string, string>
}>('imgurConfig', {
  uploadedFiles: {},
})
