import { zodResolver } from '@hookform/resolvers/zod'
import dayjs from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ScrollView, Text, View } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import FormControl from '@/components/FormControl'
import NavBar from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import StyledButton from '@/components/StyledButton'
import StyledTextInput from '@/components/StyledTextInput'
import { sov2exArgsAtom } from '@/jotai/sov2exArgsAtom'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { Sov2exArgs } from '@/servicies/other'
import tw from '@/utils/tw'

export default withQuerySuspense(SearchOptionsScreen)

function SearchOptionsScreen() {
  const [sov2exArgs, setSov2exArgsm] = useAtom(sov2exArgsAtom)

  const { control, reset, handleSubmit, watch, setValue } = useForm({
    resolver: zodResolver(Sov2exArgs),
    defaultValues: sov2exArgs,
  })

  const sort = watch('sort')

  const source = watch('source')
  const [dateField, setDateField] = useState<'gte' | 'lte' | null>(null)

  const colorScheme = useAtomValue(colorSchemeAtom)

  const { colors } = useAtomValue(uiAtom)
  const selectedDate = (dateField ? watch(dateField) : undefined) as
    | string
    | undefined

  return (
    <View style={tw`bg-[${colors.base100}] flex-1`} key={colorScheme}>
      <NavBar title="搜索条件" hideSafeTop />
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-6`}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={tw`text-lg font-semibold text-[${colors.foreground}] mb-1`}
        >
          搜索范围
        </Text>
        <Text style={tw`text-sm text-[${colors.neutral}] mb-3`}>
          使用 SOV2EX 时可按节点、作者和日期筛选结果
        </Text>
        <View
          style={tw.style(
            source === 'google' && 'opacity-50',
            `rounded-xl bg-[${colors.base200}] p-3`
          )}
          pointerEvents={source === 'google' ? 'none' : undefined}
        >
          <FormControl
            control={control}
            name="size"
            label="每页查询数量"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                keyboardType="numeric"
                placeholder="默认每页显示 20 条数据，取值范围在 10 ~ 50"
              />
            )}
          />

          <FormControl
            control={control}
            name="node"
            label="查询节点"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="为空时，查询全部节点；支持节点名称与 节点 id"
              />
            )}
          />

          <FormControl
            control={control}
            name="username"
            label="指定主题作者"
            render={({ field: { onChange, onBlur, value } }) => (
              <StyledTextInput
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="为空时，查询所有作者；不区分大小写。"
              />
            )}
          />

          <View style={tw`flex-row gap-2`}>
            <FormControl
              style={tw`flex-1`}
              control={control}
              name="gte"
              label="发帖起始日期"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="格式为 YYYY-MM-DD"
                  onFocus={() => setDateField('gte')}
                  showSoftInputOnFocus={false}
                />
              )}
            />

            <FormControl
              style={tw`flex-1`}
              control={control}
              name="lte"
              label="发帖的结束日期"
              render={({ field: { onChange, onBlur, value } }) => (
                <StyledTextInput
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="格式为 YYYY-MM-DD"
                  onFocus={() => setDateField('lte')}
                  showSoftInputOnFocus={false}
                />
              )}
            />
          </View>

          <View style={tw`flex-row`}>
            <FormControl
              style={tw`flex-1`}
              control={control}
              name="sort"
              label="查询结果排序"
              render={({ field: { onChange, value } }) => (
                <RadioButtonGroup
                  options={[
                    { label: '权重', value: 'sumup' },
                    { label: '发帖时间', value: 'created' },
                  ]}
                  value={value}
                  onChange={onChange}
                />
              )}
            />

            <View style={tw`flex-1 ml-2`}>
              {sort === 'created' && (
                <FormControl
                  control={control}
                  name="order"
                  label="发帖时间"
                  render={({ field: { onChange, value } }) => (
                    <RadioButtonGroup
                      options={[
                        { label: '降序', value: '0' },
                        { label: '升序', value: '1' },
                      ]}
                      value={value}
                      onChange={onChange}
                    />
                  )}
                />
              )}
            </View>
          </View>
        </View>

        <Text
          style={tw`text-lg font-semibold text-[${colors.foreground}] mt-5 mb-3`}
        >
          搜索服务
        </Text>
        <View style={tw`rounded-xl bg-[${colors.base200}] p-3`}>
          <FormControl
            style={tw`w-full`}
            control={control}
            name="source"
            label="搜索服务"
            render={({ field: { onChange, value } }) => (
              <RadioButtonGroup
                options={[
                  { label: 'Sov2ex', value: 'sov2ex' },
                  { label: 'Google', value: 'google' },
                ]}
                value={value}
                onChange={onChange}
              />
            )}
          />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View style={tw`flex-row p-4`}>
          <StyledButton
            style={tw`flex-1`}
            shape="rounded"
            size="large"
            ghost
            onPress={() => {
              reset({
                size: 20,
                sort: 'created',
                order: '0',
                gte: '',
                lte: '',
                username: '',
                q: '',
                source: 'sov2ex',
                node: '',
              })
            }}
          >
            重置
          </StyledButton>
          <StyledButton
            onPress={() => {
              handleSubmit(values => {
                setSov2exArgsm(values)
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
      <DateTimePickerModal
        isVisible={dateField !== null}
        mode="date"
        display="inline"
        locale="zh-CN"
        date={
          selectedDate && dayjs(selectedDate).isValid()
            ? dayjs(selectedDate).toDate()
            : new Date()
        }
        onConfirm={date => {
          if (dateField) {
            const updateValue = setValue as any
            updateValue(dateField, dayjs(date).format('YYYY-MM-DD'))
          }
          setDateField(null)
        }}
        onCancel={() => setDateField(null)}
      />
    </View>
  )
}
