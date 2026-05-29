import { createContext } from 'react'

export const HtmlContext = createContext<{
  onPreview: (url: string) => void
  paddingX: number
  inModalScreen?: boolean
  selectable: boolean
}>({ onPreview: () => {}, paddingX: 32, selectable: true })
