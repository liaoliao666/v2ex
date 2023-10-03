import { createContext } from 'react'

export const HtmlContext = createContext<{
  onPreview: (url: string) => void
  paddingX: number
  inModalScreen?: boolean
  onSelectText: () => void
}>({ onPreview: () => {}, paddingX: 32, onSelectText: () => {} })
