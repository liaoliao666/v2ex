import { createContext } from 'react'

export const HtmlContext = createContext<{
  onPreview: (url: string) => void
  paddingX: number
  inModalScreen?: boolean
  selectable: boolean
  onInlineImageLoaded?: (url: string) => void
}>({ onPreview: () => {}, paddingX: 32, selectable: true })
