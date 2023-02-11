import { zodResolver } from '@hookform/resolvers/zod'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { compact, isString } from 'lodash-es'
import { Fragment, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, Text, View, useWindowDimensions } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { inferVariables } from 'react-query-kit'
import { z } from 'zod'

import FormControl from '@/components/FormControl'
import Html from '@/components/Html'
import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { usePreview } from '@/servicies/preview'
import {
  useEditTopic,
  useEditTopicInfo,
  useTopicDetail,
  useWriteTopic,
} from '@/servicies/topic'
import { Topic } from '@/servicies/types'
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
  syntax: z.enum(['default', 'markdown']),
})

const LazyPreviewTopic = withQuerySuspense(PreviewTopic, {
  Loading: () => {
    const navbarHeight = useNavBarHeight()
    const layout = useWindowDimensions()
    return (
      <View
        style={{
          height: layout.height - navbarHeight,
        }}
      >
        <LoadingIndicator />
      </View>
    )
  },
})

export default withQuerySuspense(WriteTopicScreen, {
  Loading: () => {
    const {
      params: { topic },
    } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()
    const isEdit = !!topic
    return (
      <View style={tw`bg-body-1 flex-1`}>
        <NavBar title={isEdit ? '编辑主题' : '创作新主题'} />
        <LoadingIndicator />
      </View>
    )
  },
  FallbackComponent: props => {
    const {
      params: { topic },
    } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()
    const isEdit = !!topic
    return (
      <View style={tw`bg-body-1 flex-1`}>
        <NavBar title={isEdit ? '编辑主题' : '创作新主题'} />
        <FallbackComponent {...props} />
      </View>
    )
  },
})

function WriteTopicScreen() {
  const {
    params: { topic },
  } = useRoute<RouteProp<RootStackParamList, 'WriteTopic'>>()

  const isEdit = !!topic

  const { data: editTopicInfo } = useEditTopicInfo({
    variables: { id: topic?.id! },
    enabled: isEdit,
    suspense: isEdit,
  })

  const prevTopic = { ...topic, ...editTopicInfo } as Topic

  const { control, handleSubmit, getValues } = useForm<
    z.infer<typeof WriteTopicArgs>
  >({
    resolver: zodResolver(WriteTopicArgs),
    defaultValues: isEdit ? prevTopic : { syntax: 'default' },
  })

  const navigation = useNavigation()

  const writeTopicMutation = useWriteTopic()

  const editTopicMutation = useEditTopic()

  const navbarHeight = useNavBarHeight()

  const [preview, setPreview] = useState(false)

  const [showPreviewButton, setShowPreviewButton] = useState(
    !!prevTopic.content
  )

  return (
    <View style={tw`bg-body-1 flex-1`}>
      <ScrollView
        style={tw`flex-1 p-4`}
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        {preview ? (
          <LazyPreviewTopic
            syntax={getValues('syntax')}
            text={getValues('content')!}
            title={getValues('title')}
          />
        ) : (
          <Fragment>
            <FormControl
              control={control}
              name="node"
              label="节点"
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
                    placeholder="请选择主题节点"
                  />
                </Pressable>
              )}
            />

            <FormControl
              control={control}
              name="title"
              label="标题"
              render={({ field: { value, onChange, onBlur } }) => (
                <StyledTextInput
                  placeholder="请输入标题"
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
              extra={
                <View style={tw`mb-2`}>
                  <Controller
                    control={control}
                    name="syntax"
                    render={({ field: { value, onChange } }) => (
                      <RadioButtonGroup
                        options={[
                          { label: 'V2EX 原生格式', value: 'default' },
                          { label: 'Markdown', value: 'markdown' },
                        ]}
                        value={value}
                        onChange={onChange}
                      />
                    )}
                  />
                </View>
              }
              render={({ field: { value, onChange, onBlur } }) => (
                <StyledTextInput
                  placeholder="标题如果能够表达完整内容，则正文可以为空"
                  onChangeText={text => {
                    setShowPreviewButton(!!text)
                    onChange(text)
                  }}
                  onBlur={onBlur}
                  defaultValue={value}
                  multiline
                  style={tw`h-50 py-2`}
                  textAlignVertical="top"
                />
              )}
            />

            <StyledButton
              style={tw`mt-auto`}
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
                        syntax: values.syntax === 'default' ? 0 : 1,
                        prevTopic,
                      })

                      queryClient.refetchQueries(
                        useTopicDetail.getKey({ id: topic?.id })
                      )
                    } else {
                      await writeTopicMutation.mutateAsync({
                        title: values.title.trim(),
                        content: values.content?.trim(),
                        node_name: values.node.name,
                        syntax: values.syntax,
                        once: store.get(profileAtom)?.once!,
                      })
                    }

                    Toast.show({
                      type: 'success',
                      text1: isEdit ? `编辑成功` : '发帖成功',
                    })

                    navigation.goBack()
                  } catch (error) {
                    Toast.show({
                      type: 'error',
                      text1: isEdit ? `编辑失败` : '发帖失败',
                    })
                  }
                })()
              }}
              shape="rounded"
              size="large"
            >
              {isEdit ? '保存' : '发布主题'}
            </StyledButton>
          </Fragment>
        )}

        <SafeAreaView edges={['bottom']} />
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0 z-10`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          title={isEdit ? '编辑主题' : '创作新主题'}
          right={
            showPreviewButton && (
              <StyledButton
                shape="rounded"
                onPress={() => setPreview(!preview)}
              >
                {preview ? '退出预览' : '预览'}
              </StyledButton>
            )
          }
        />
      </View>
    </View>
  )
}

function PreviewTopic({
  title,
  ...variables
}: inferVariables<typeof usePreview> & { title?: string }) {
  const { data } = usePreview({
    variables,
    enabled: !!variables.text,
    suspense: true,
  })

  return (
    <Fragment>
      {title && (
        <Text
          style={tw`text-tint-primary ${getFontSize(3)} font-bold pb-2`}
          selectable
        >
          {title}
        </Text>
      )}

      {isString(data) && <Html source={{ html: data }} paddingX={32} />}
    </Fragment>
  )
}
