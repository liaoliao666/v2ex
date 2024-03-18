import { Octicons } from '@expo/vector-icons'
import { getScale } from 'color2k'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast, {
  BaseToast,
  ErrorToast,
  SuccessToast,
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message'

import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { formatColor, getUI } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const toastConfig: ToastConfig = {
  info: props => <BaseToast {...getToastProps(props)} />,
  success: props => <SuccessToast {...getToastProps(props)} />,
  error: props => <ErrorToast {...getToastProps(props)} />,
}

function getToastProps(props: ToastConfigParams<any>) {
  const { fontSize, colors } = getUI()
  const color = props.type === 'error' ? colors.danger : colors.primary
  const iconName =
    props.type === 'success'
      ? 'check-circle-fill'
      : props.type === 'error'
      ? 'x-circle-fill'
      : 'info'
  const bgColor = formatColor(
    getScale(
      color,
      store.get(colorSchemeAtom) === 'dark' ? 'black' : 'white'
    )(0.8)
  )

  return {
    ...props,
    style: tw`rounded-lg border-[${color}] bg-[${bgColor}] border border-solid border-l border-l-[${color}]`,
    contentContainerStyle: tw`overflow-hidden pl-0`,
    text1Style: tw.style(
      `${fontSize.medium} text-[${colors.foreground}]`,
      props.text2 ? `font-semibold` : `font-normal`
    ),
    text2Style: tw`${fontSize.small} text-[${colors.default}]`,
    renderLeadingIcon: () => (
      <View style={tw`px-4 justify-center`}>
        <Octicons name={iconName} size={24} color={color} />
      </View>
    ),
  }
}

export default function StyledToast() {
  const safeAreaInsets = useSafeAreaInsets()
  return (
    <Toast
      config={toastConfig}
      topOffset={Math.max(40, safeAreaInsets.top + 8)}
    />
  )
}
