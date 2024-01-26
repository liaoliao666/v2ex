import { useAtomValue } from 'jotai'
import { Fade } from 'rn-placeholder'
import { FadeProps } from 'rn-placeholder/lib/animations/Fade'

import { uiAtom } from '@/jotai/uiAtom'

export default function StyledFade(props: FadeProps) {
  const { colors } = useAtomValue(uiAtom)

  return (
    <Fade
      {...props}
      style={{
        backgroundColor: colors.base300,
      }}
    />
  )
}
