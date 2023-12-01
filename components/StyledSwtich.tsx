import { Platform, Switch, SwitchProps } from 'react-native'

export default function StyledSwitch(props: SwitchProps) {
  return (
    <Switch
      trackColor={
        Platform.OS === 'android' ? undefined : { true: `rgb(26,140,216)` }
      }
      {...props}
    />
  )
}
