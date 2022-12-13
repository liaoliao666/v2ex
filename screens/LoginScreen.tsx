import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigation } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { useForm } from 'react-hook-form'
import { Alert, Text, TouchableWithoutFeedback, View } from 'react-native'
import { z } from 'zod'

import StyledImage from '@/components/StyledImage'
import { cookieAtom } from '@/jotai/cookieAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useSignin, useSigninInfo } from '@/servicies/authentication'
import tw from '@/utils/tw'
import { stripString } from '@/utils/zodHelper'

import FormControl from '../components/FormControl'
import NavBar from '../components/NavBar'
import StyledButton from '../components/StyledButton'
import StyledTextInput from '../components/StyledTextInput'

export const SigninArgs = z.object({
  username: z.preprocess(stripString, z.string()),
  password: z.preprocess(stripString, z.string()),
  code: z.preprocess(stripString, z.string()),
})

export default function LoginScreen() {
  const SigninInfoQuery = useSigninInfo()

  const signinMutation = useSignin()

  const { control, getValues } = useForm<z.infer<typeof SigninArgs>>({
    resolver: zodResolver(SigninArgs),
  })

  const navigation = useNavigation()

  useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar title="登录" />

      {SigninInfoQuery.data?.is_limit ? (
        <View style={tw`flex-1 p-8`}>
          <Text
            style={tw`text-[31px] leading-9 font-extrabold text-tint-primary`}
          >
            登录受限
          </Text>
          <Text style={tw`text-body-5 text-tint-secondary mt-2`}>
            由于当前 IP 在短时间内的登录尝试次数太多，目前暂时不能继续尝试。
          </Text>
          <Text style={tw`text-body-5 text-tint-secondary mt-2`}>
            你可能会需要等待至多 1 天的时间再继续尝试。
          </Text>
          <StyledButton
            style={tw`h-[52px] mt-7`}
            onPress={() => {
              SigninInfoQuery.refetch()
            }}
            size="large"
            shape="rounded"
          >
            {SigninInfoQuery.isFetching ? '重试中...' : '重试'}
          </StyledButton>
        </View>
      ) : (
        <View style={tw`flex-1`}>
          <View style={tw`w-3/4 mx-auto mt-8`}>
            <FormControl
              control={control}
              name="username"
              label="用户名"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  size="large"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  placeholder="用户名或电子邮件地址"
                  keyboardType="email-address"
                />
              )}
            />

            <FormControl
              control={control}
              name="password"
              label="密码"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  size="large"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  textContentType="password"
                  secureTextEntry
                  placeholder="请输入密码"
                />
              )}
            />

            <FormControl
              control={control}
              name="code"
              label="你是机器人吗？"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TouchableWithoutFeedback
                    onPress={() => {
                      if (!SigninInfoQuery.isFetching) {
                        SigninInfoQuery.refetch()
                      }
                    }}
                  >
                    <StyledImage
                      style={tw`w-full h-12 rounded-lg mb-2 bg-[rgb(185,202,211)] dark:bg-[rgb(62,65,68)]`}
                      source={{ uri: SigninInfoQuery.data?.captcha }}
                    />
                  </TouchableWithoutFeedback>

                  <StyledTextInput
                    size="large"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value?.toString()}
                    placeholder="请输入上图中的验证码，点击可以更换图片"
                    keyboardType="email-address"
                  />
                </View>
              )}
            />

            <View style={tw`min-h-[16px]`}>
              {!!signinMutation.error?.message && (
                <Text style={tw`text-body-6 text-[#ff4d4f]`}>
                  {signinMutation.error.message}
                </Text>
              )}
            </View>

            <StyledButton
              size="large"
              style={tw`w-full mt-4`}
              onPress={async () => {
                if (signinMutation.isLoading) return
                if (!SigninInfoQuery.isSuccess) return

                try {
                  const cookie = await signinMutation.mutateAsync({
                    [SigninInfoQuery.data.username_hash!]:
                      getValues('username'),
                    [SigninInfoQuery.data.password_hash!]:
                      getValues('password'),
                    [SigninInfoQuery.data.code_hash!]: getValues('code'),
                    once: SigninInfoQuery.data.once!,
                  })

                  store.set(cookieAtom, cookie)
                  navigation.goBack()
                } catch (error) {
                  Alert.alert(
                    '登录失败',
                    ``,
                    [
                      {
                        text: '确定',
                        onPress: () => {
                          SigninInfoQuery.refetch()
                        },
                      },
                    ],
                    {
                      userInterfaceStyle: store.get(colorSchemeAtom),
                    }
                  )
                }
              }}
            >
              登录
            </StyledButton>
          </View>
        </View>
      )}
    </View>
  )
}
