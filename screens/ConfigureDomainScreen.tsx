import { zodResolver } from '@hookform/resolvers/zod'
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
import { baseUrlAtom, v2exURL } from '@/jotai/baseUrlAtom'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { isValidURL } from '@/utils/url'
import { stripString } from '@/utils/zodHelper'

export default withQuerySuspense(ConfigureDomainScreen)

const configureDomainScheme = z.object({
  baseURL: z.preprocess(
    stripString,
    z
      .string()
      .trim()
      .refine(val => isValidURL(val), {
        message: 'Invalid URL',
      })
  ),
})

function ConfigureDomainScreen() {
  const navbarHeight = useNavBarHeight()

  const [baseURL, setBaseURL] = useAtom(baseUrlAtom)

  const { control, handleSubmit, setValue } = useForm<
    z.infer<typeof configureDomainScheme>
  >({
    resolver: zodResolver(configureDomainScheme),
    defaultValues: {
      baseURL,
    },
  })

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <View style={tw`w-3/4 mx-auto mt-8`}>
          <Text style={tw`${getFontSize(5)} text-foreground mb-4`}>
            如果你因为一些原因无法访问v2ex的域名，你可以选择配置调用 API
            的域名，支持协议+ip+端口。
          </Text>

          <FormControl
            control={control}
            name="baseURL"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                size="large"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                placeholder="请输入你的域名"
                keyboardType="email-address"
              />
            )}
          />

          <StyledButton
            size="large"
            style={tw`w-full mt-4`}
            onPress={handleSubmit(async values => {
              setBaseURL(values.baseURL)
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
          style={tw`border-b border-solid border-divider`}
          title="域名配置"
          right={
            <StyledButton
              shape="rounded"
              onPress={async () => {
                setBaseURL(v2exURL)
                setValue('baseURL', v2exURL)
                Toast.show({
                  type: 'success',
                  text1: `重置成功`,
                })
              }}
            >
              重置
            </StyledButton>
          }
        />
      </View>
    </View>
  )
}
