import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast, {
  BaseToast,
  ErrorToast,
  SuccessToast,
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message'

import { getUI } from '@/jotai/uiAtom'
import tw from '@/utils/tw'

const toastConfig: ToastConfig = {
  info: props => <BaseToast {...getToastProps(props)} />,
  success: props => <SuccessToast {...getToastProps(props)} />,
  error: props => <ErrorToast {...getToastProps(props)} />,
}

function getToastProps(props: ToastConfigParams<any>) {
  const { fontSize, colors } = getUI()
  return {
    ...props,
    contentContainerStyle: tw`overflow-hidden dark:bg-[#262626]`,
    text1Style: tw.style(
      `${fontSize.medium} text-[${colors.foreground}]`,
      !props.text2 && `font-normal`
    ),
    text2Style: tw`${fontSize.small}`,
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
