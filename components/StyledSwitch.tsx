import { useAtomValue } from 'jotai'
import { Switch, SwitchProps } from 'react-native'

import { uiAtom } from '@/jotai/uiAtom'

export default function StyledSwitch(props: SwitchProps) {
  const { colors } = useAtomValue(uiAtom)

  return (
    <Switch
      trackColor={{ true: colors.primary, false: colors.primary }}
      thumbColor={colors.primaryContent}
      {...props}
    />
  )
}
