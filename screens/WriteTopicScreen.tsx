import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigation } from '@react-navigation/native'
import { compact } from 'lodash-es'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import NavBar from '@/components/NavBar'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { useWriteTopic } from '@/servicies/topic'
import { validateLoginStatus } from '@/utils/authentication'
import tw from '@/utils/tw'
import { stripString } from '@/utils/zodHelper'

const WriteTopicArgs = z.object({
  title: z.preprocess(stripString, z.string()),
  content: z.preprocess(stripString, z.string().optional()),
  node: z.preprocess(
    stripString,
    z.object({
      title: z.string(),
      name: z.string(),
    })
  ),
})

export default function WriteTopicScreen() {
  const { control, handleSubmit } = useForm<z.infer<typeof WriteTopicArgs>>({
    resolver: zodResolver(WriteTopicArgs),
  })

  const navigation = useNavigation()

  const { mutateAsync, isLoading } = useWriteTopic()

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <NavBar title="创作新主题" />

      <View style={tw`flex-1 p-4`}>
        <FormControl
          control={control}
          name="node"
          label="节点"
          render={({ field: { value, onChange } }) => (
            <StyledTextInput
              editable={false}
              value={
                value
                  ? compact([value.title, value.name]).join(' / ')
                  : undefined
              }
              placeholder="请选择主题节点"
              onPressIn={() => {
                navigation.navigate('SearchNode', {
                  onNodeItemPress: onChange,
                })
              }}
            />
          )}
        />

        <FormControl
          control={control}
          name="title"
          label="标题"
          render={({ field: { value, onChange, onBlur } }) => (
            <StyledTextInput
              placeholder="标题如果能够表达完整内容，则正文可以为空"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <FormControl
          control={control}
          name="content"
          label="正文"
          render={({ field: { onChange, onBlur } }) => (
            <StyledTextInput
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={5}
              style={tw`h-32`}
            />
          )}
        />

        <SafeAreaView edges={['bottom']} style={tw`mt-auto`}>
          <StyledButton
            onPress={() => {
              handleSubmit(async values => {
                try {
                  validateLoginStatus()

                  if (isLoading) return

                  await mutateAsync({
                    title: values.title,
                    content: values.content,
                    node_name: values.node.name,
                    once: store.get(profileAtom)?.once!,
                  })

                  Toast.show({
                    type: 'success',
                    text1: '发帖成功',
                  })

                  navigation.goBack()
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: '发帖失败',
                  })
                }
              })()
            }}
            shape="rounded"
            size="large"
          >
            发布主题
          </StyledButton>
        </SafeAreaView>
      </View>
    </View>
  )
}
