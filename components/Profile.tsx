import {
  Feather,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { RESET } from 'jotai/utils'
import { omit, pick } from 'lodash-es'
import { ReactNode, memo } from 'react'
import {
  Pressable,
  PressableProps,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Money from '@/components/Money'
import Space from '@/components/Space'
import StyledImage from '@/components/StyledImage'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom, themeAtom } from '@/jotai/themeAtom'
import { useSignout } from '@/servicies/authentication'
import { RootStackParamList } from '@/types'
import { clearCookie } from '@/utils/cookie'
import tw from '@/utils/tw'
import { openURL } from '@/utils/url'

import Badge from './Badge'
import { withQuerySuspense } from './QuerySuspense'
import RadioButtonGroup from './RadioButtonGroup'

export default withQuerySuspense(memo(Profile))

function Profile() {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const [theme, setTheme] = useAtom(themeAtom)

  const profile = useAtomValue(profileAtom)

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const isLogin = !!profile?.once

  const userOptions = [
    {
      label: '节点收藏',
      value: 'my_nodes',
      icon: (
        <MaterialCommunityIcons
          color={tw`text-tint-primary`.color as string}
          size={24}
          name={'family-tree'}
        />
      ),
      onPress: () => {
        navigation.navigate('MyNodes')
      },
    },
    {
      label: '主题收藏',
      value: 'my_topics',
      icon: (
        <MaterialCommunityIcons
          color={tw`text-tint-primary`.color as string}
          size={24}
          name={'comment-outline'}
        />
      ),
      onPress: () => {
        navigation.navigate('MyTopics')
      },
    },
    {
      label: '特别关注',
      value: 'my_following',
      icon: (
        <MaterialCommunityIcons
          color={tw`text-tint-primary`.color as string}
          size={24}
          name={'account-heart-outline'}
        />
      ),
      onPress: () => {
        navigation.navigate('MyFollowing')
      },
    },
    {
      label: '未读提醒',
      value: 'my_notification',
      icon: (
        <Badge content={profile?.my_notification}>
          <MaterialCommunityIcons
            color={tw`text-tint-primary`.color as string}
            size={24}
            name={'bell-outline'}
          />
        </Badge>
      ),
      onPress: () => {
        navigation.navigate('Notifications')
      },
    },
    {
      label: '最近浏览',
      value: 'RecentTopic',
      icon: (
        <MaterialCommunityIcons
          color={tw`text-tint-primary`.color as string}
          size={24}
          name={'clock-check-outline'}
        />
      ),
      onPress: () => {
        navigation.navigate('RecentTopic')
      },
    },
  ]

  return (
    <SafeAreaView edges={['top']} style={tw`flex-1 bg-body-1`}>
      {isLogin ? (
        <View style={tw`p-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <StyledImage
              style={tw`w-10 h-10 rounded-full`}
              source={{
                uri: profile?.avatar,
              }}
            />

            <TouchableOpacity
              onPress={() => {
                navigation.push('MemberDetail', {
                  username: profile?.username!,
                })
              }}
              style={tw`flex-row items-center`}
            >
              <Text style={tw`text-tint-secondary text-[15px] mr-1`}>
                个人主页
              </Text>
              <SimpleLineIcons
                name="arrow-right"
                color={tw`text-tint-secondary`.color as string}
                size={10}
              />
            </TouchableOpacity>
          </View>

          <Space style={tw`items-center pt-2`}>
            <Text style={tw`text-tint-primary text-[20px] leading-6 font-bold`}>
              {profile?.username}
            </Text>

            <Money
              style={tw`mt-1`}
              {...pick(profile, ['gold', 'silver', 'bronze'])}
            />
          </Space>

          {!!profile?.motto && (
            <Text style={tw`text-tint-secondary text-body-5 mt-2`}>
              {profile?.motto}
            </Text>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={tw`px-4 py-8 flex-row items-center`}
          onPress={async () => {
            await clearCookie()
            navigation.navigate('Login')
          }}
        >
          <StyledImage
            style={tw`w-16 h-16 mb-2 rounded-full bg-[rgb(185,202,211)] dark:bg-[rgb(62,65,68)]`}
          />
          <View style={tw`flex-row items-center ml-2`}>
            <Text style={tw`text-[24px] text-tint-primary`}>点我登录</Text>
            <SimpleLineIcons
              name="arrow-right"
              color={tw`text-tint-primary ml-2`.color as string}
              size={14}
            />
          </View>
        </TouchableOpacity>
      )}

      <ScrollView>
        {isLogin &&
          userOptions.map(item => (
            <ProfileItem key={item.value} {...omit(item, ['value'])} />
          ))}

        <View style={tw`border-t border-solid border-tint-border`}>
          <ProfileItem
            label="外观"
            icon={
              <Feather
                color={tw`text-tint-primary`.color as string}
                size={24}
                name={colorScheme === 'light' ? 'sun' : 'moon'}
              />
            }
            action={
              <RadioButtonGroup
                options={[
                  { label: '浅色', value: 'light' },
                  { label: '深色', value: 'dark' },
                  { label: '系统', value: 'system' },
                ]}
                value={theme}
                onChange={setTheme}
              />
            }
          />

          <ProfileItem
            label="节点导航"
            icon={
              <Feather
                color={tw`text-tint-primary`.color as string}
                size={24}
                name="navigation"
              />
            }
            onPress={() => {
              navigation.navigate('NavNodes')
            }}
          />

          <ProfileItem
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

          {isLogin && <SignoutItem once={profile?.once!} />}
        </View>

        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </SafeAreaView>
  )
}

function ProfileItem({
  label,
  icon,
  action,
  onPress,
}: {
  label: string
  icon: ReactNode
  action?: ReactNode
  onPress?: PressableProps['onPress']
}) {
  return (
    <Pressable
      style={({ pressed }) =>
        tw.style(
          `px-4 h-[56px] flex-row items-center`,
          pressed && `bg-message-press`
        )
      }
      onPress={onPress}
    >
      {icon}

      <Text style={tw`ml-6 text-[20px] font-medium text-tint-primary mr-auto`}>
        {label}
      </Text>

      {action}
    </Pressable>
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
    <ProfileItem
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
