import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { sleep } from '@tanstack/query-core/build/lib/utils'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import { Fragment } from 'react'
import { Platform, ScrollView, Switch, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'

import ListItem from '@/components/ListItem'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import RadioButtonGroup from '@/components/RadioButtonGroup'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import v2exMessage from '@/components/V2exWebview/v2exMessage'
import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { enabledAutoCheckinAtom } from '@/jotai/enabledAutoCheckinAtom'
import { enabledMsgPushAtom } from '@/jotai/enabledMsgPushAtom'
import { enabledParseImageAtom } from '@/jotai/enabledParseImage'
import { fontScaleAtom, getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useSignout } from '@/servicies/authentication'
import { confirm } from '@/utils/confirm'
import { clearCookie } from '@/utils/cookie'
import { queryClient } from '@/utils/query'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

export default withQuerySuspense(SettingScreen)

function SettingScreen() {
  useAtomValue(colorSchemeAtom)

  const navbarHeight = useNavBarHeight()

  const profile = useAtomValue(profileAtom)

  const navigation = useNavigation()

  const [enabledAutoCheckin, setEnabledAutoCheckin] = useAtom(
    enabledAutoCheckinAtom
  )

  const [enabledMsgPush, setEnabledMsgPush] = useAtom(enabledMsgPushAtom)

  const [fontScale, setFontScale] = useAtom(fontScaleAtom)

  const [enabledParseImage, setEnabledParseImage] = useAtom(
    enabledParseImageAtom
  )

  const isSignined = !!profile?.once

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <View style={tw`px-4 pt-6 -mt-3 pb-3 flex-row`}>
          <StyledImage
            style={tw`w-12 h-12 mr-3 rounded`}
            source={{
              uri: `https://cdn.v2ex.com/navatar/c81e/728d/2_large.png?m=1497247332`,
            }}
          />

          <View style={tw`flex-1`}>
            <Text style={tw`text-tint-primary ${getFontSize(4)} font-bold`}>
              V2EX
            </Text>
            <Text style={tw`text-tint-primary ${getFontSize(5)} mt-1`}>
              创意工作者们的社区
            </Text>
          </View>
        </View>

        {isSignined && (
          <Fragment>
            <ListItem
              label="自动签到"
              icon={
                <MaterialCommunityIcons
                  color={tw.color(`text-tint-primary`)}
                  size={24}
                  name={'calendar-check'}
                />
              }
              action={
                <Switch
                  value={enabledAutoCheckin}
                  trackColor={
                    Platform.OS === 'android'
                      ? undefined
                      : { true: `rgb(26,140,216)` }
                  }
                  onValueChange={() =>
                    setEnabledAutoCheckin(!enabledAutoCheckin)
                  }
                />
              }
              pressable={false}
            />

            <ListItem
              label="消息通知"
              icon={
                <MaterialCommunityIcons
                  color={tw.color(`text-tint-primary`)}
                  size={24}
                  name={'bell-outline'}
                />
              }
              action={
                <Switch
                  value={enabledMsgPush}
                  trackColor={
                    Platform.OS === 'android'
                      ? undefined
                      : { true: `rgb(26,140,216)` }
                  }
                  onValueChange={() => setEnabledMsgPush(!enabledMsgPush)}
                />
              }
              pressable={false}
            />
          </Fragment>
        )}

        <ListItem
          label="图片解析"
          icon={
            <Feather
              color={tw.color(`text-tint-primary`)}
              size={24}
              name={'image'}
            />
          }
          action={
            <Switch
              value={enabledParseImage}
              trackColor={
                Platform.OS === 'android'
                  ? undefined
                  : { true: `rgb(26,140,216)` }
              }
              onValueChange={async () => {
                try {
                  if (!enabledParseImage)
                    await confirm(
                      '开启后不限定图床',
                      '并支持 3 种方式：图片URL、![]()、<img />'
                    )
                  setEnabledParseImage(!enabledParseImage)
                } catch (error) {
                  // empty
                }
              }}
            />
          }
          pressable={false}
        />

        <ListItem
          label="字体大小"
          icon={
            <MaterialCommunityIcons
              color={tw.color(`text-tint-primary`)}
              size={24}
              name={'format-font'}
            />
          }
          action={
            <RadioButtonGroup
              options={[
                { label: '小', value: 'small' },
                { label: '中', value: 'medium' },
                { label: '大', value: 'large' },
                { label: '超大', value: 'super' },
              ]}
              value={fontScale}
              onChange={setFontScale}
            />
          }
          pressable={false}
        />

        <ListItem
          label="问题反馈"
          icon={
            <Feather
              color={tw.color(`text-tint-primary`)}
              size={24}
              name="github"
            />
          }
          onPress={() => {
            openURL('https://github.com/liaoliao666/v2ex/issues')
          }}
        />

        <ListItem
          label="清除缓存"
          icon={
            <MaterialCommunityIcons
              color={tw.color(`text-tint-primary`)}
              size={24}
              name="delete-empty-outline"
            />
          }
          onPress={async () => {
            try {
              await confirm(`确认清除缓存吗？`, `该动作会导致删除所有缓存数据`)
              queryClient.removeQueries()
              Toast.show({
                type: 'success',
                text1: `清除缓存成功`,
              })
            } catch (error) {
              // empty
            }
          }}
        />

        {isSignined ? (
          <Fragment>
            {Platform.OS !== 'android' && (
              <ListItem
                label="注销帐号"
                icon={
                  <Feather
                    color={tw.color(`text-tint-primary`)}
                    size={24}
                    name={'delete'}
                  />
                }
                onPress={async () => {
                  try {
                    await confirm(`确定注销当前账号 ${profile.username} 么？`)
                    await sleep(500)
                    Toast.show({
                      type: 'success',
                      text1: `注销成功`,
                    })
                    store.set(deletedNamesAtom, prev => [
                      ...new Set([...prev, profile.username]),
                    ])
                    store.set(profileAtom, RESET)
                  } catch (error) {}
                }}
              />
            )}
            <SignoutItem once={profile.once!} />
          </Fragment>
        ) : (
          <StyledButton
            onPress={() => {
              navigation.navigate('Login')
            }}
            size="large"
            shape="rounded"
            style={tw`mx-4 mt-12`}
          >
            登录
          </StyledButton>
        )}
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="更多选项" />
      </View>
    </View>
  )
}

function SignoutItem({ once }: { once: string }) {
  const { isLoading, mutateAsync } = useSignout({
    onError: () => {},
  })

  const setProfileAtom = useSetAtom(profileAtom)

  async function logout() {
    try {
      if (isLoading) return
      await mutateAsync({ once })
    } catch (error) {
      // empty
    } finally {
      await clearCookie()
      await setProfileAtom(RESET)
      v2exMessage.reloadWebview()
    }
  }

  return (
    <StyledButton
      onPress={logout}
      size="large"
      shape="rounded"
      style={tw`mx-4 mt-12`}
    >
      退出登录
    </StyledButton>
  )
}
