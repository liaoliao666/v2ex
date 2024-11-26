import { createContext } from 'react'

export const HtmlContext = createContext<{
  paddingX: number
  inModalScreen?: boolean
  onSelectText: () => void
  selectOnly?: boolean
}>({ paddingX: 32, onSelectText: () => {} })
