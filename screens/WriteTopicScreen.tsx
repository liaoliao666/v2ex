import { zodResolver } from '@hookform/resolvers/zod'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { sleep } from '@tanstack/query-core/build/lib/utils'
import { compact } from 'lodash-es'
import { useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { useEditTopic, useTopicDetail, useWriteTopic } from '@/servicies/topic'
import { RootStackParamList } from '@/types'
import { isSignined } from '@/utils/authentication'
import { queryClient } from '@/utils/query'
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
  const {
    params: { topic },
  } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()

  const isEdit = !!topic

  const { control, handleSubmit } = useForm<z.infer<typeof WriteTopicArgs>>({
    resolver: zodResolver(WriteTopicArgs),
    defaultValues: topic,
  })

  const navigation = useNavigation()

  const writeTopicMutation = useWriteTopic()

  const editTopicMutation = useEditTopic()

  const navbarHeight = useNavBarHeight()

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <ScrollView
        style={tw`flex-1 p-4`}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <FormControl
          control={control}
          name="node"
          label="??????"
          render={({ field: { value, onChange } }) => (
            <Pressable
              onPress={() => {
                if (!topic || topic.editable) {
                  navigation.navigate('SearchNode', {
                    onPressNodeItem: onChange,
                  })
                }
              }}
            >
              <StyledTextInput
                pointerEvents="none"
                editable={false}
                value={
                  value
                    ? compact([value.title, value.name]).join(' / ')
                    : undefined
                }
                placeholder="?????????????????????"
              />
            </Pressable>
          )}
        />

        <FormControl
          control={control}
          name="title"
          label="??????"
          render={({ field: { value, onChange, onBlur } }) => (
            <StyledTextInput
              placeholder="???????????????"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <FormControl
          control={control}
          name="content"
          label="??????"
          render={({ field: { value, onChange, onBlur } }) => (
            <StyledTextInput
              placeholder="????????????????????????????????????????????????????????????"
              onChangeText={onChange}
              onBlur={onBlur}
              defaultValue={value}
              multiline
              numberOfLines={5}
              style={tw`h-32 py-2`}
              textAlignVertical="top"
            />
          )}
        />

        <SafeAreaView edges={['bottom']} style={tw`mt-auto`}>
          <StyledButton
            onPress={() => {
              if (!isSignined()) {
                navigation.navigate('Login')
                return
              }

              handleSubmit(async values => {
                try {
                  if (
                    writeTopicMutation.isLoading ||
                    editTopicMutation.isLoading
                  )
                    return

                  if (isEdit) {
                    await editTopicMutation.mutateAsync({
                      title: values.title.trim(),
                      content: values.content?.trim(),
                      node_name: values.node.name,
                      prevTopic: topic,
                    })

                    await sleep(1000)

                    queryClient.refetchQueries(
                      useTopicDetail.getKey({ id: topic?.id })
                    )
                  } else {
                    await writeTopicMutation.mutateAsync({
                      title: values.title.trim(),
                      content: values.content?.trim(),
                      node_name: values.node.name,
                      once: store.get(profileAtom)?.once!,
                    })
                  }

                  Toast.show({
                    type: 'success',
                    text1: isEdit ? `????????????` : '????????????',
                  })

                  navigation.goBack()
                } catch (error) {
                  Toast.show({
                    type: 'error',
                    text1: isEdit ? `????????????` : '????????????',
                  })
                }
              })()
            }}
            shape="rounded"
            size="large"
          >
            {isEdit ? '??????' : '????????????'}
          </StyledButton>
        </SafeAreaView>
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title={isEdit ? '????????????' : '???????????????'} />
      </View>
    </View>
  )
}
