import Feather from 'react-native-vector-icons/Feather'
import Toast from 'react-native-toast-message'

import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { store } from '@/jotai/store'
import { navigation } from '@/navigation/navigationRef'
import { k } from '@/servicies'

import StyledButton, { StyledButtonProps } from './StyledButton'

export default function UploadImageButton({
  onUploaded,
  ...styledBUttonProps
}: StyledButtonProps & {
  onUploaded: (url: string) => void
}) {
  const { mutateAsync, isPending } = k.other.uploadImage.useMutation()

  return (
    <StyledButton
      {...styledBUttonProps}
      onPress={async () => {
        if (!store.get(imgurConfigAtom)?.clientId) {
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
      icon={<Feather name="image" size={16} />}
    >
      {isPending ? '上传中' : '图片'}
    </StyledButton>
  )
}
