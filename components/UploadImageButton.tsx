import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { store } from '@/jotai/store'
import { useUploadImage } from '@/servicies/image'

import StyledButton, { StyledButtonProps } from './StyledButton'

export default function UploadImageButton({
  onUploaded,
  ...styledBUttonProps
}: StyledButtonProps & {
  onUploaded: (url: string) => void
}) {
  const { mutateAsync, isPending } = useUploadImage()

  const navigation = useNavigation()

  return (
    <StyledButton
      {...styledBUttonProps}
      onPress={async () => {
        if (!(await store.get(imgurConfigAtom)?.clientId)) {
          navigation.navigate('ImgurConfig')
          return
        }

        if (isPending) return
        try {
          onUploaded(await mutateAsync())
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: error instanceof Error ? error.message : '上传图片失败',
          })
        }
      }}
      icon={<Feather name="image" color="white" size={16} />}
    >
      {isPending ? '上传中' : '图片'}
    </StyledButton>
  )
}
