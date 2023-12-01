import { zodResolver } from '@hookform/resolvers/zod'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useAtom } from 'jotai'
import { isInteger } from 'lodash-es'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import NavBar from '@/components/NavBar'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { socksAgentConfigAtom } from '@/jotai/socksAgentConfigAtom'
import { navigation } from '@/navigation/navigationRef'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'
import { isValidURL } from '@/utils/url'

const ScoksAgentScheme = z.object({
  host: z
    .string()
    .trim()
    .refine(val => isValidURL(val), {
      message: 'Invalid URL',
    }),
  port: z
    .string()
    .trim()
    .refine(val => isInteger(val), 'Invaild port'),
  user: z.string().trim().optional(),
  password: z.string().trim().optional(),
})

export default function EditSocks5Screen() {
  const { params } =
    useRoute<RouteProp<RootStackParamList, 'EditSocks5Screen'>>()

  const [{ agents }, setSocksAgentConfig] = useAtom(socksAgentConfigAtom)

  const { control, reset, handleSubmit } = useForm({
    resolver: zodResolver(ScoksAgentScheme),
    defaultValues: agents[params.index!],
  })

  return (
    <View style={tw`bg-background flex-1`}>
      <NavBar
        style={tw`border-divider border-solid border-b`}
        title="Socks5"
        hideSafeTop
      />
      <View style={tw`flex-1 p-4`}>
        <FormControl
          control={control}
          name="host"
          label="服务器"
          render={({ field: { onChange, onBlur, value } }) => (
            <StyledTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <FormControl
          control={control}
          name="port"
          label="端口"
          render={({ field: { onChange, onBlur, value } }) => (
            <StyledTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <FormControl
          control={control}
          name="user"
          label="用户名（可选）"
          render={({ field: { onChange, onBlur, value } }) => (
            <StyledTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />

        <FormControl
          control={control}
          name="password"
          label="密码（可选）"
          render={({ field: { onChange, onBlur, value } }) => (
            <StyledTextInput
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      <SafeAreaView edges={['bottom']}>
        <View style={tw`flex-row p-4`}>
          <StyledButton
            style={tw`flex-1`}
            shape="rounded"
            size="large"
            ghost
            onPress={() => {
              reset({
                host: undefined,
                password: undefined,
                user: undefined,
                port: undefined,
                ...agents,
              })
            }}
          >
            重置
          </StyledButton>
          <StyledButton
            onPress={() => {
              handleSubmit(values => {
                if (isInteger(params.index)) {
                  setSocksAgentConfig(prev => {
                    const nextAgents = [...prev.agents]
                    nextAgents[params.index!] = values

                    return {
                      ...prev,
                      agents: nextAgents,
                    }
                  })
                }

                navigation.goBack()
              })()
            }}
            style={tw`flex-1 ml-2`}
            shape="rounded"
            size="large"
          >
            提交
          </StyledButton>
        </View>
      </SafeAreaView>
    </View>
  )
}
