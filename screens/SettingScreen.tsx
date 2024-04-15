import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
} from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import { Fragment } from 'react'
import { Platform, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import Badge from '@/components/Badge'
import ListItem from '@/components/ListItem'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import StyledImage from '@/components/StyledImage'
import StyledSwitch from '@/components/StyledSwitch'
import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { enabledAutoCheckinAtom } from '@/jotai/enabledAutoCheckinAtom'
import { enabledMsgPushAtom } from '@/jotai/enabledMsgPushAtom'
import { enabledParseContentAtom } from '@/jotai/enabledParseContent'
import { enabledWebviewAtom } from '@/jotai/enabledWebviewAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { uiAtom } from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import { k } from '@/servicies'
import { confirm } from '@/utils/confirm'
import { clearCookie } from '@/utils/cookie'
import { queryClient } from '@/utils/query'
import { sleep } from '@/utils/sleep'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

export default withQuerySuspense(SettingScreen)

function SettingScreen() {
  const navbarHeight = useNavBarHeight()

  const profile = useAtomValue(profileAtom)

  const [enabledAutoCheckin, setEnabledAutoCheckin] = useAtom(
    enabledAutoCheckinAtom
  )

  const [enabledMsgPush, setEnabledMsgPush] = useAtom(enabledMsgPushAtom)

  const [enabledParseContent, setEnabledParseContent] = useAtom(
    enabledParseContentAtom
  )

  const [enabledWebview, setEnabledWebview] = useAtom(enabledWebviewAtom)

  const isSignined = !!profile?.once

  const safeAreaInsets = useSafeAreaInsets()

  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <View style={tw`px-4 pt-3 pb-3 flex-row`}>
          <StyledImage
            style={tw`w-12 h-12 mr-3 rounded`}
            source={`https://cdn.v2ex.com/navatar/c81e/728d/2_large.png?m=1497247332`}
          />

          <View style={tw`flex-1`}>
            <Text
              style={tw`text-[${colors.foreground}] ${fontSize.large} font-semibold`}
            >
              V2EX
            </Text>
            <Text
              style={tw`text-[${colors.foreground}] ${fontSize.medium} mt-1`}
            >
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
                  color={colors.foreground}
                  size={24}
                  name={'calendar-check'}
                />
              }
              action={
                <StyledSwitch
                  value={enabledAutoCheckin}
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
                  color={colors.foreground}
                  size={24}
                  name={'bell-outline'}
                />
              }
              action={
                <StyledSwitch
                  value={enabledMsgPush}
                  onValueChange={() => setEnabledMsgPush(!enabledMsgPush)}
                />
              }
              pressable={false}
            />
          </Fragment>
        )}

        <ListItem
          label="内容解析"
          icon={
            <MaterialCommunityIcons
              color={colors.foreground}
              size={24}
              name={'format-text'}
            />
          }
          action={
            <StyledSwitch
              value={enabledParseContent}
              onValueChange={async () => {
                try {
                  if (enabledParseContent)
                    await confirm(
                      '内容解析',
                      '关闭后将不会自动解析回复中的Base64和图片URL、![]()、<img />'
                    )
                  setEnabledParseContent(!enabledParseContent)
                } catch (error) {
                  // empty
                }
              }}
            />
          }
          pressable={false}
        />

        <ListItem
          label="内置浏览器"
          icon={<Octicons name="browser" size={24} color={colors.foreground} />}
          action={
            <StyledSwitch
              value={enabledWebview}
              onValueChange={async () => {
                try {
                  if (enabledWebview)
                    await confirm(
                      '内置浏览器',
                      '关闭后打开链接时将使用外部浏览器'
                    )
                  setEnabledWebview(!enabledWebview)
                } catch (error) {
                  // empty
                }
              }}
            />
          }
          pressable={false}
        />

        <ListItem
          label="主题设置"
          icon={
            <Ionicons
              color={colors.foreground}
              name="color-filter-sharp"
              size={24}
            />
          }
          onPress={() => {
            navigation.navigate('CustomizeTheme')
          }}
        />

        <ListItem
          label="问题反馈"
          icon={<Feather color={colors.foreground} size={24} name="github" />}
          onPress={() => {
            navigation.navigate('Webview', {
              url: 'https://github.com/liaoliao666/v2ex/issues',
            })
          }}
        />

        <ListItem
          label="社区排行"
          icon={
            <Ionicons
              color={colors.foreground}
              size={24}
              name={'analytics-sharp'}
            />
          }
          onPress={() => {
            navigation.navigate('Rank')
          }}
        />

        <ListItem
          label="图片上传"
          icon={<Feather color={colors.foreground} size={24} name="image" />}
          onPress={() => {
            navigation.navigate('ImgurConfig')
          }}
        />

        <ListItem
          label="域名配置"
          icon={
            <Ionicons
              color={colors.foreground}
              name="planet-outline"
              size={24}
            />
          }
          onPress={() => {
            navigation.navigate('ConfigureDomain')
          }}
        />

        {Platform.OS === 'android' && <CheckAppVersion />}

        {isSignined && (
          <ListItem
            label="屏蔽列表"
            icon={
              <MaterialIcons
                color={colors.foreground}
                size={24}
                name={'block'}
              />
            }
            onPress={() => {
              navigation.navigate('BlankList')
            }}
          />
        )}

        <ListItem
          label="清除缓存"
          icon={
            <MaterialCommunityIcons
              color={colors.foreground}
              size={24}
              name="delete-empty-outline"
            />
          }
          onPress={async () => {
            try {
              await confirm(`确认清除缓存吗？`, `该动作会导致删除所有缓存数据`)
              queryClient.removeQueries()
              Image.clearDiskCache()
              Image.clearMemoryCache()

              Toast.show({
                type: 'success',
                text1: `清除缓存成功`,
              })
            } catch (error) {
              // empty
            }
          }}
        />

        {isSignined && Platform.OS === 'ios' && (
          <ListItem
            label="注销帐号"
            icon={
              <Feather color={colors.foreground} size={24} name={'delete'} />
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
      </ScrollView>

      <View style={tw`px-4 pt-4 pb-[${Math.max(safeAreaInsets.bottom, 16)}px]`}>
        <View style={tw`max-w-[400px] w-full mx-auto`}>
          {isSignined ? (
            <SignoutItem once={profile.once!} />
          ) : (
            <StyledButton
              onPress={() => {
                navigation.navigate('Login')
              }}
              size="large"
              shape="rounded"
            >
              登录
            </StyledButton>
          )}
        </View>
      </View>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="更多选项" />
      </View>
    </View>
  )
}

function SignoutItem({ once }: { once: string }) {
  const { isPending, mutateAsync } = k.auth.signout.useMutation()

  const setProfileAtom = useSetAtom(profileAtom)

  async function logout() {
    try {
      if (isPending) return
      await mutateAsync({ once })
    } catch (error) {
      // empty
    } finally {
      await clearCookie()
      await setProfileAtom(RESET)
    }
  }

  return (
    <StyledButton onPress={logout} size="large" shape="rounded">
      退出登录
    </StyledButton>
  )
}

function CheckAppVersion() {
  const { data, refetch, isFetching } = k.other.latestVersion.useQuery()
  const { colors, fontSize } = useAtomValue(uiAtom)

  return (
    <ListItem
      label={
        data?.need_upgrade
          ? '更新版本'
          : isFetching
          ? '检查更新中...'
          : '检查更新'
      }
      icon={
        data?.need_upgrade ? (
          <Badge>
            <MaterialIcons color={colors.foreground} size={24} name="upgrade" />
          </Badge>
        ) : (
          <MaterialIcons color={colors.foreground} size={24} name="upgrade" />
        )
      }
      onPress={() => {
        if (data?.need_upgrade) {
          openURL(data.download_url)
        } else {
          refetch().then(query => {
            if (query.data?.need_upgrade) {
              Toast.show({
                type: 'success',
                text1: `你有新的版本需要更新`,
              })
            } else {
              Toast.show({
                type: 'info',
                text1: `无可用更新`,
              })
            }
          })
        }
      }}
      action={
        !!data?.version && (
          <Text style={tw`text-[${colors.default}] ${fontSize.medium}`}>
            v{data.version}
          </Text>
        )
      }
    />
  )
}
