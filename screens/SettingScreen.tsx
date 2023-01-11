import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { sleep } from '@tanstack/query-core/build/lib/utils'
import { useAtomValue, useSetAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import { Fragment } from 'react'
import { ScrollView, View } from 'react-native'
import Toast from 'react-native-toast-message'

import ListItem from '@/components/ListItem'
import NavBar, { useNavBarHeight } from '@/components/NavBar'
import { withQuerySuspense } from '@/components/QuerySuspense'
import StyledBlurView from '@/components/StyledBlurView'
import { deletedNamesAtom } from '@/jotai/deletedNamesAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { store } from '@/jotai/store'
import { useSignout } from '@/servicies/authentication'
import { confirm } from '@/utils/confirm'
import { clearCookie } from '@/utils/cookie'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

export default withQuerySuspense(SettingScreen)

function SettingScreen() {
  const navbarHeight = useNavBarHeight()

  const profile = useAtomValue(profileAtom)

  return (
    <View style={tw`flex-1`}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: navbarHeight,
        }}
      >
        <ListItem
          label="Github"
          icon={
            <Feather
              color={tw`text-tint-primary`.color as string}
              size={24}
              name="github"
            />
          }
          onPress={() => {
            openURL('https://github.com/liaoliao666/v2ex')
          }}
        />

        {profile?.once && (
          <Fragment>
            <ListItem
              label="注销帐号"
              icon={
                <Feather
                  color={tw`text-tint-primary`.color as string}
                  size={24}
                  name={'delete'}
                />
              }
              onPress={async () => {
                try {
                  await confirm(`确定注销当前账号 ${profile.username} 么？`)
                  await sleep(500)
                  await Toast.show({
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

            <SignoutItem once={profile.once} />
          </Fragment>
        )}
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar title="设置" />
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
      setProfileAtom(RESET)
      clearCookie()
    }
  }

  return (
    <ListItem
      label="退出登录"
      icon={
        <MaterialCommunityIcons
          color={tw`text-tint-primary`.color as string}
          size={24}
          name={'exit-to-app'}
        />
      }
      onPress={logout}
    />
  )
}
