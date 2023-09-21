import {
  Feather,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from '@expo/vector-icons'
import { useAtom, useAtomValue } from 'jotai'
import { isBoolean, omit, pick } from 'lodash-es'
import { memo } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Money from '@/components/Money'
import StyledImage from '@/components/StyledImage'
import { fontScaleAtom, getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom, themeAtom } from '@/jotai/themeAtom'
import { getNavigation } from '@/navigation/navigationRef'
import { clearCookie } from '@/utils/cookie'
import tw from '@/utils/tw'

import Badge from './Badge'
import ListItem from './ListItem'
import { NAV_BAR_HEIGHT } from './NavBar'
import { withQuerySuspense } from './QuerySuspense'
import RadioButtonGroup from './RadioButtonGroup'

export default withQuerySuspense(memo(Profile))

function Profile({ onlyIcon }: { onlyIcon?: boolean }) {
  const colorScheme = useAtomValue(colorSchemeAtom)

  const fontScale = useAtomValue(fontScaleAtom)

  const [theme, setTheme] = useAtom(themeAtom)

  const profile = useAtomValue(profileAtom)

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
        getNavigation()?.navigate('MyNodes')
      },
    },
    {
      label: '主题收藏',
      value: 'my_topics',
      icon: (
        <Feather
          color={tw.color(`text-tint-primary`)}
          size={24}
          name={'bookmark'}
        />
      ),
      onPress: () => {
        getNavigation()?.navigate('MyTopics')
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
        getNavigation()?.navigate('MyFollowing')
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
        getNavigation()?.navigate('Notifications')
      },
    },
  ]

  return (
    <SafeAreaView
      edges={['top']}
      style={tw`flex-1 bg-body-1`}
      key={onlyIcon ? 'profile' : fontScale}
    >
      {isLogin ? (
        onlyIcon ? (
          <TouchableOpacity
            style={tw`mx-auto h-[${NAV_BAR_HEIGHT}px] justify-center items-center`}
            onPress={() => {
              getNavigation()?.navigate('MemberDetail', {
                username: profile?.username!,
              })
            }}
          >
            <StyledImage
              style={tw`w-8 h-8 rounded-full`}
              source={{
                uri: profile?.avatar,
              }}
            />
          </TouchableOpacity>
        ) : (
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
                  getNavigation()?.navigate('MemberDetail', {
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
                style={tw`text-tint-primary ${getFontSize(
                  2
                )} font-bold flex-shrink mr-2`}
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
        )
      ) : onlyIcon ? (
        <TouchableOpacity
          style={tw`mx-auto h-[${NAV_BAR_HEIGHT}px] justify-center items-center`}
          onPress={async () => {
            try {
              await clearCookie()
            } finally {
              getNavigation()?.navigate('Login')
            }
          }}
        >
          <View style={tw`w-8 h-8 rounded-full img-loading`} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={tw`px-4 py-8 flex-row items-center`}
          onPress={async () => {
            try {
              await clearCookie()
            } finally {
              getNavigation()?.navigate('Login')
            }
          }}
        >
          <View style={tw`w-16 h-16 mb-2 rounded-full img-loading`} />
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
            <ListItem
              key={item.value}
              {...omit(item, onlyIcon ? ['value', 'label'] : ['value'])}
            />
          ))}

        <View
          style={
            !isBoolean(onlyIcon) && tw`border-t border-solid border-tint-border`
          }
        >
          {!onlyIcon && (
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
                  style={tw`ml-2`}
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
          )}

          <ListItem
            label={!onlyIcon ? '最近浏览' : undefined}
            icon={
              <MaterialCommunityIcons
                color={tw.color(`text-tint-primary`)}
                size={24}
                name={'clock-check-outline'}
              />
            }
            onPress={() => {
              getNavigation()?.navigate('RecentTopic')
            }}
          />

          <ListItem
            label={!onlyIcon ? '节点导航' : undefined}
            icon={
              <Feather
                color={tw.color(`text-tint-primary`)}
                size={24}
                name="navigation"
              />
            }
            onPress={() => {
              getNavigation()?.navigate('NavNodes')
            }}
          />

          <ListItem
            label={!onlyIcon ? '更多选项' : undefined}
            icon={
              <Feather
                color={tw.color(`text-tint-primary`)}
                size={24}
                name="settings"
              />
            }
            onPress={() => {
              getNavigation()?.navigate('Setting')
            }}
          />
        </View>

        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </SafeAreaView>
  )
}
