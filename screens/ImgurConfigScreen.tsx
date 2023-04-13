import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigation } from '@react-navigation/native'
import { useAtom } from 'jotai'
import { useForm } from 'react-hook-form'
import { ScrollView, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { imgurConfigAtom } from '@/jotai/imgurConfigAtom'
import { confirm } from '@/utils/confirm'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'
import { stripString } from '@/utils/zodHelper'

export default withQuerySuspense(ImgurConfigScreen)

const ImgConfigScheme = z.object({
  clientId: z.preprocess(stripString, z.string().optional()),
})

function ImgurConfigScreen() {
  const navbarHeight = useNavBarHeight()

  const [imgurConfig, setImgurConfig] = useAtom(imgurConfigAtom)

  const { control, handleSubmit } = useForm<z.infer<typeof ImgConfigScheme>>({
    resolver: zodResolver(ImgConfigScheme),
    defaultValues: {
      clientId: imgurConfig.clientId,
    },
  })

  const navigation = useNavigation()

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <View style={tw`w-3/4 mx-auto mt-8`}>
          <Text style={tw`${getFontSize(5)} text-tint-primary`}>
            由于上传图片依赖 Imgur 的服务，请输入你的 Imgur 账户的
            clientId，如果你还没有 Imgur 账户，你需要按照下面两步去创建一个
            Imgur 应用
          </Text>

          <Text
            onPress={() => {
              openURL(`https://imgur.com/register`)
            }}
            style={tw`text-tint-secondary mt-2 ${getFontSize(5)}`}
          >
            1. 创建 Imgur 账户
          </Text>
          <Text
            onPress={() => {
              openURL(`https://api.imgur.com/#registerapp`)
            }}
            style={tw`text-tint-secondary mt-1 mb-2 ${getFontSize(5)}`}
          >
            2. 创建 Imgur 应用
          </Text>

          <FormControl
            control={control}
            name="clientId"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                size="large"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                placeholder="请输入你的 Imgur clientId"
                keyboardType="email-address"
              />
            )}
          />

          <StyledButton
            size="large"
            style={tw`w-full mt-4`}
            onPress={handleSubmit(async ({ clientId }) => {
              setImgurConfig(prev => ({
                ...prev,
                clientId,
              }))
              navigation.goBack()
            })}
          >
            {'保存'}
          </StyledButton>
        </View>
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          style={tw`border-b border-solid border-tint-border`}
          title="Imgur配置"
          right={
            <StyledButton
              shape="rounded"
              onPress={async () => {
                try {
                  await confirm(
                    `确认清除缓存吗？`,
                    `该操作会导致重复上传已上传的图片`
                  )
                  setImgurConfig(prev => ({
                    ...prev,
                    uploadedFiles: {},
                  }))
                  Toast.show({
                    type: 'success',
                    text1: `清除成功`,
                  })
                } catch (error) {
                  // empty
                }
              }}
            >
              清除缓存
            </StyledButton>
          }
        />
      </View>
    </View>
  )
}
