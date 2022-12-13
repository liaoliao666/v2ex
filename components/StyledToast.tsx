import Toast, {
  BaseToast,
  ErrorToast,
  SuccessToast,
  ToastConfig,
} from 'react-native-toast-message'

import tw from '@/utils/tw'

const toastConfig: ToastConfig = {
  info: props => (
    <BaseToast
      {...props}
      contentContainerStyle={tw`bg-body-2`}
      text1Style={tw.style(
        `text-body-5 text-tint-primary`,
        !props.text2 && `font-normal`
      )}
      text2Style={tw`text-body-6`}
    />
  ),
  success: props => (
    <SuccessToast
      {...props}
      contentContainerStyle={tw`bg-body-2`}
      text1Style={tw.style(
        `text-body-5 text-tint-primary`,
        !props.text2 && `font-normal`
      )}
      text2Style={tw`text-body-6`}
    />
  ),
  error: props => (
    <ErrorToast
      {...props}
      contentContainerStyle={tw`bg-body-2`}
      text1Style={tw.style(
        `text-body-5 text-tint-primary`,
        !props.text2 && `font-normal`
      )}
      text2Style={tw`text-body-6`}
    />
  ),
}

export default function StyledToast() {
  return <Toast config={toastConfig} />
}
