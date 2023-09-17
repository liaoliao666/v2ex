import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useMutation } from 'quaere'
import Toast from 'react-native-toast-message'

import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { store } from '@/jotai/store'
import { uploadImageMutation } from '@/servicies/image'
import tw from '@/utils/tw'

import StyledButton, { StyledButtonProps } from './StyledButton'

export default function UploadImageButton({
  onUploaded,
  ...styledBUttonProps
}: StyledButtonProps & {
  onUploaded: (url: string) => void
}) {
  const { trigger, isMutating } = useMutation({
    mutation: uploadImageMutation,
  })

  const navigation = useNavigation()

  return (
    <StyledButton
      {...styledBUttonProps}
      onPress={async () => {
        if (!store.get(imgurConfigAtom)?.clientId) {
          navigation.navigate('ImgurConfig')
          return
        }

        if (isMutating) return
        try {
          onUploaded(await trigger())
        } catch (error) {
          Toast.show({
            type: 'error',
            text1: error instanceof Error ? error.message : '上传图片失败',
          })
        }
      }}
      icon={
        <Feather
          name="image"
          color={tw.color(`text-white dark:text-secondary`)}
          size={16}
        />
      }
    >
      {isMutating ? '上传中' : '图片'}
    </StyledButton>
  )
}
