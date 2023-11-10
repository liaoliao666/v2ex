import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast, {
  BaseToast,
  ErrorToast,
  SuccessToast,
  ToastConfig,
  ToastConfigParams,
} from 'react-native-toast-message'

import { getFontSize } from '@/jotai/fontSacleAtom'
import tw from '@/utils/tw'

const toastConfig: ToastConfig = {
  info: props => <BaseToast {...getToastProps(props)} />,
  success: props => <SuccessToast {...getToastProps(props)} />,
  error: props => <ErrorToast {...getToastProps(props)} />,
}

function getToastProps(props: ToastConfigParams<any>) {
  return {
    ...props,
    contentContainerStyle: tw`overflow-hidden dark:bg-[#262626]`,
    text1Style: tw.style(
      `${getFontSize(5)} text-foreground`,
      !props.text2 && `font-normal`
    ),
    text2Style: tw`${getFontSize(6)}`,
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
