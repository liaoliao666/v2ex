import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAtom, useAtomValue } from 'jotai'
import { omit, pick } from 'lodash-es'
import { memo } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Money from '@/components/Money'
import StyledImage from '@/components/StyledImage'
import { fontScaleAtom, getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom, themeAtom } from '@/jotai/themeAtom'
import { RootStackParamList } from '@/types'
import { clearCookie } from '@/utils/cookie'
import tw from '@/utils/tw'

import Badge from './Badge'
import ListItem from './ListItem'
import { withQuerySuspense } from './QuerySuspense'
import RadioButtonGroup from './RadioButtonGroup'

export default withQuerySuspense(memo(Profile))

function Profile() {
  const colorScheme = useAtomValue(colorSchemeAtom)

  const fontScale = useAtomValue(fontScaleAtom)

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
          color={tw.color(`text-tint-primary`)}
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
          color={tw.color(`text-tint-primary`)}
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
          color={tw.color(`text-tint-primary`)}
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
            color={tw.color(`text-tint-primary`)}
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
          color={tw.color(`text-tint-primary`)}
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
    <SafeAreaView edges={['top']} style={tw`flex-1 bg-body-1`} key={fontScale}>
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
                navigation.navigate('MemberDetail', {
                  username: profile?.username!,
                })
              }}
              style={tw`flex-row items-center`}
            >
              <Text style={tw`text-tint-secondary mr-1 ${getFontSize(5)}`}>
                个人主页
              </Text>
              <SimpleLineIcons
                name="arrow-right"
                color={tw.color(`text-tint-secondary`)}
                size={10}
              />
            </TouchableOpacity>
          </View>

          <View style={tw`pt-2 flex-row items-center`}>
            <Text
              style={tw`text-tint-primary text-[20px] leading-6 font-bold flex-shrink mr-2`}
              numberOfLines={1}
            >
              {profile?.username}
            </Text>

            <Money
              style={tw`mt-1`}
              {...pick(profile, ['gold', 'silver', 'bronze'])}
            />
          </View>

          {!!profile?.motto && (
            <Text style={tw`text-tint-secondary ${getFontSize(5)} mt-2`}>
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
          <StyledImage style={tw`w-16 h-16 mb-2 rounded-full bg-loading`} />
          <View style={tw`flex-row items-center ml-2`}>
            <Text style={tw`text-[24px] text-tint-primary`}>点我登录</Text>
            <SimpleLineIcons
              name="arrow-right"
              color={tw.color(`text-tint-primary`)}
              size={14}
            />
          </View>
        </TouchableOpacity>
      )}

      <ScrollView>
        {isLogin &&
          userOptions.map(item => (
            <ListItem key={item.value} {...omit(item, ['value'])} />
          ))}

        <View style={tw`border-t border-solid border-tint-border`}>
          <ListItem
            label="外观"
            icon={
              <Feather
                color={tw.color(`text-tint-primary`)}
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

          <ListItem
            label="节点导航"
            icon={
              <Feather
                color={tw.color(`text-tint-primary`)}
                size={24}
                name="navigation"
              />
            }
            onPress={() => {
              navigation.navigate('NavNodes')
            }}
          />

          <ListItem
            label="社区排行"
            icon={
              <Ionicons
                color={tw.color(`text-tint-primary`)}
                size={24}
                name={'md-analytics-outline'}
              />
            }
            onPress={() => {
              navigation.navigate('Rank')
            }}
          />

          <ListItem
            label="更多选项"
            icon={
              <Feather
                color={tw.color(`text-tint-primary`)}
                size={24}
                name="settings"
              />
            }
            onPress={() => {
              navigation.navigate('Setting')
            }}
          />
        </View>

        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </SafeAreaView>
  )
}
