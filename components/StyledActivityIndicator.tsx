import { ActivityIndicator, ActivityIndicatorProps } from 'react-native'

import tw from '@/utils/tw'

const StyledActivityIndicator = (props: ActivityIndicatorProps) => {
  return (
    <ActivityIndicator
      color={tw.color(`android:text-[#536471] dark:text-[#e7e9ea]`)}
      {...props}
    />
  )
}

export default StyledActivityIndicator
