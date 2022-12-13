import { RefreshControl, RefreshControlProps } from 'react-native'

import tw from '@/utils/tw'

export default function StyledRefreshControl({
  tintColor,
  ...props
}: RefreshControlProps) {
  const color =
    tintColor || (tw`text-[#536471] dark:text-[#e7e9ea]`.color as string)
  return <RefreshControl colors={[color]} tintColor={color} {...props} />
}
