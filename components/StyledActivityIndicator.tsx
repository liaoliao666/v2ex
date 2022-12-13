import { ActivityIndicator, ActivityIndicatorProps } from 'react-native'

import tw from '@/utils/tw'

const StyledActivityIndicator = (props: ActivityIndicatorProps) => {
  return (
    <ActivityIndicator
      color={tw`text-[#536471] dark:text-[#e7e9ea]`.color as string}
      {...props}
    />
  )
}

export default StyledActivityIndicator
