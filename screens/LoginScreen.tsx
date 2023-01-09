import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigation } from '@react-navigation/native'
import { useAtomValue } from 'jotai'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import BouncyCheckbox from 'react-native-bouncy-checkbox'
import { z } from 'zod'

import StyledBlurView from '@/components/StyledBlurView'
import StyledImage from '@/components/StyledImage'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import {
  useSignin,
  useSigninInfo,
  useTwoStepSignin,
} from '@/servicies/authentication'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import { stripString } from '@/utils/zodHelper'

import FormControl from '../components/FormControl'
import NavBar, { useNavBarHeight } from '../components/NavBar'
import StyledButton from '../components/StyledButton'
import StyledTextInput from '../components/StyledTextInput'

const SigninArgs = z.object({
  username: z.preprocess(stripString, z.string()),
  password: z.preprocess(stripString, z.string()),
  code: z.preprocess(stripString, z.string()),
  agreeTerms: z.boolean().refine(val => !!val, {
    message: '请勾选同意《用户协议》《隐私政策》后登录',
  }),
})

export default function LoginScreen() {
  const SigninInfoQuery = useSigninInfo()

  const signinMutation = useSignin()

  const { control, getValues, handleSubmit } = useForm<
    z.infer<typeof SigninArgs>
  >({
    resolver: zodResolver(SigninArgs),
  })

  const [twoStepOnce, setTwoStepOnce] = useState('')

  const navigation = useNavigation()

  useAtomValue(colorSchemeAtom)

  function renderLimitContent() {
    return (
      <View style={tw`p-8`}>
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
    )
  }

  function renderNormalSignin() {
    return (
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
              <TouchableOpacity
                onPress={() => {
                  if (!SigninInfoQuery.isFetching) {
                    SigninInfoQuery.refetch()
                  }
                }}
                style={tw`aspect-4 mb-2 w-full`}
              >
                <StyledImage
                  style={tw`w-full h-full rounded-lg bg-[rgb(185,202,211)] dark:bg-[rgb(62,65,68)]`}
                  source={{
                    uri: SigninInfoQuery.data?.captcha,
                    headers: SigninInfoQuery.data?.cookie
                      ? {
                          Cookie: SigninInfoQuery.data.cookie,
                        }
                      : undefined,
                  }}
                />
              </TouchableOpacity>

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
          onPress={handleSubmit(async () => {
            if (signinMutation.isLoading) return
            if (!SigninInfoQuery.isSuccess) return

            try {
              const result = await signinMutation.mutateAsync({
                [SigninInfoQuery.data.username_hash!]:
                  getValues('username').trim(),
                [SigninInfoQuery.data.password_hash!]:
                  getValues('password').trim(),
                [SigninInfoQuery.data.code_hash!]: getValues('code').trim(),
                once: SigninInfoQuery.data.once!,
              })

              if (result['2fa']) {
                setTwoStepOnce(result.once!)
                return
              }

              navigation.goBack()
              queryClient.refetchQueries({ type: 'active' })
            } catch (error) {
              SigninInfoQuery.refetch()
            }
          })}
        >
          {signinMutation.isLoading ? '登录中...' : '登录'}
        </StyledButton>

        <FormControl
          control={control}
          name="agreeTerms"
          render={({ field: { value, onChange } }) => (
            <View style={tw`flex-row items-center mt-4`}>
              <BouncyCheckbox
                isChecked={value}
                onPress={() => {
                  onChange(!value)
                }}
                size={16}
                fillColor={tw`text-secondary`.color as string}
                unfillColor={tw`dark:text-[#0f1419] text-white`.color as string}
              />
              <Text style={tw`text-body-6 text-tint-secondary -ml-2`}>
                我已阅读并同意
                <Text
                  style={tw`text-tint-primary`}
                  onPress={() => {
                    navigation.navigate('GItHubMD', {
                      url: 'https://github.com/liaoliao666/v2ex/blob/main/terms-and-conditions_zh.md',
                      title: '用户协议',
                    })
                  }}
                >
                  《用户协议》
                </Text>
                和
                <Text
                  style={tw`text-tint-primary`}
                  onPress={() => {
                    navigation.navigate('GItHubMD', {
                      url: 'https://github.com/liaoliao666/v2ex/blob/main/privacy-policy_zh.md',
                      title: '隐私政策',
                    })
                  }}
                >
                  《隐私政策》
                </Text>
              </Text>
            </View>
          )}
        />

        <TouchableOpacity
          style={tw`w-full mt-4 flex-row justify-center items-center h-[52px] px-8`}
          onPress={() => {
            if (!SigninInfoQuery.data?.once) return
            navigation.navigate('WebSignin', {
              once: SigninInfoQuery.data.once,
              onTwoStepOnce: setTwoStepOnce,
            })
          }}
        >
          <StyledImage
            source={{
              uri: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQK4PQZCFUtcTcnrZPxzTznGkOKaTwcIMjth0k9lG_SFmhf5kYvCacJWkeSpA&s=10`,
            }}
            style={tw`w-5 h-5`}
          />
          <Text style={tw`text-body-5 text-tint-secondary ml-2`}>谷歌登录</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        {SigninInfoQuery.data?.is_limit ? (
          renderLimitContent()
        ) : twoStepOnce ? (
          <TwoStepSignin once={twoStepOnce} />
        ) : (
          renderNormalSignin()
        )}
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="登录" />
      </View>
    </View>
  )
}

const TwoStepSigninArgs = z.object({
  code: z.preprocess(stripString, z.string()),
})

function TwoStepSignin({ once }: { once: string }) {
  const { control, getValues, handleSubmit } = useForm<
    z.infer<typeof SigninArgs>
  >({
    resolver: zodResolver(TwoStepSigninArgs),
  })

  const { mutateAsync, isLoading, error } = useTwoStepSignin()

  const navigation = useNavigation()

  return (
    <View style={tw`w-3/4 mx-auto mt-8`}>
      <Text style={tw`text-body-5 text-tint-primary mb-2`}>
        你的 V2EX 账号已经开启了两步验证，请输入验证码继续
      </Text>

      <FormControl
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <StyledTextInput
            size="large"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value?.toString()}
            placeholder="请输入验证码"
            keyboardType="email-address"
          />
        )}
      />

      <View style={tw`min-h-[16px]`}>
        {!!error?.message && (
          <Text style={tw`text-body-6 text-[#ff4d4f]`}>{error.message}</Text>
        )}
      </View>
      <StyledButton
        size="large"
        style={tw`w-full mt-4`}
        onPress={handleSubmit(async () => {
          if (isLoading) return
          await mutateAsync({
            ...getValues(),
            once,
          })
          navigation.goBack()
          queryClient.refetchQueries({ type: 'active' })
        })}
      >
        {isLoading ? '登录中...' : '登录'}
      </StyledButton>

      <Text style={tw`text-body-5 text-tint-primary mt-2`}>
        出于安全考虑，当你开启了两步验证功能之后，那么你将需要每两周输入一次你的两步验证码续
      </Text>
    </View>
  )
}
