import { createContext } from 'react'

export const HtmlContext = createContext<{
  onPreview: (url: string) => void
  paddingX: number
  inModalScreen?: boolean
  disabledPartialSelectable?: boolean
}>({ onPreview: () => {}, paddingX: 32 })
