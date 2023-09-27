import {
  Feather,
  MaterialCommunityIcons,
  SimpleLineIcons,
} from '@expo/vector-icons'
import { useAtom, useAtomValue } from 'jotai'
import { compact, omit, pick } from 'lodash-es'
import { memo } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Money from '@/components/Money'
import StyledImage from '@/components/StyledImage'
import { fontScaleAtom, getFontSize } from '@/jotai/fontSacleAtom'
import { profileAtom } from '@/jotai/profileAtom'
import { colorSchemeAtom, themeAtom } from '@/jotai/themeAtom'
import { navigation } from '@/navigation/navigationRef'
import { clearCookie } from '@/utils/cookie'
import tw from '@/utils/tw'

import Badge from './Badge'
import IconButton from './IconButton'
import ListItem, { ListItemProps } from './ListItem'
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

  const listOptions = compact([
    isLogin && {
      label: '节点收藏',
      value: 'my_nodes',
      icon: (
        <IconButton
          pressed={false}
          icon={<MaterialCommunityIcons name={'family-tree'} />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('MyNodes')
      },
    },
    isLogin && {
      label: '主题收藏',
      value: 'my_topics',
      icon: (
        <IconButton
          pressed={false}
          icon={<Feather name={'bookmark'} />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('MyTopics')
      },
    },
    isLogin && {
      label: '特别关注',
      value: 'my_following',
      icon: (
        <IconButton
          pressed={false}
          icon={<MaterialCommunityIcons name={'account-heart-outline'} />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('MyFollowing')
      },
    },
    isLogin && {
      label: '未读提醒',
      value: 'my_notification',
      icon: (
        <IconButton
          pressed={false}
          icon={
            <View>
              <Badge content={profile?.my_notification}>
                <MaterialCommunityIcons
                  size={24}
                  name={'bell-outline'}
                  color={tw.color(`text-tint-primary`)}
                />
              </Badge>
            </View>
          }
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('Notifications')
      },
    },
    !onlyIcon && {
      label: '外观',
      value: 'color_scheme',
      icon: (
        <Feather
          color={tw.color(`text-tint-primary`)}
          size={24}
          name={colorScheme === 'light' ? 'sun' : 'moon'}
        />
      ),
      action: (
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
      ),
      style: tw`border-t border-solid border-tint-border`,
    },
    {
      label: '最近浏览',
      value: 'recent_topic',
      icon: (
        <IconButton
          pressed={false}
          icon={<MaterialCommunityIcons name={'clock-check-outline'} />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('RecentTopic')
      },
    },
    {
      label: '节点导航',
      value: 'nav_nodes',
      icon: (
        <IconButton
          pressed={false}
          icon={<Feather name="navigation" />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('NavNodes')
      },
    },
    {
      label: '更多选项',
      value: 'setting',
      icon: (
        <IconButton
          pressed={false}
          icon={<Feather name="settings" />}
          size={24}
          color={tw.color(`text-tint-primary`)}
          activeColor={tw.color(`text-tint-secondary`)}
        />
      ),
      onPress: () => {
        navigation.navigate('Setting')
      },
    },
  ]) as (ListItemProps & { value: string })[]

  return (
    <SafeAreaView
      edges={['top']}
      style={tw.style(`flex-1 bg-body-1`, onlyIcon && `px-2`)}
      key={onlyIcon ? 'profile' : fontScale}
    >
      {isLogin ? (
        onlyIcon ? (
          <TouchableOpacity
            style={tw`mx-auto h-[${NAV_BAR_HEIGHT}px] justify-center items-center`}
            onPress={() => {
              navigation.navigate('MemberDetail', {
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
              navigation.navigate('Login')
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
              navigation.navigate('Login')
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
        {listOptions.map(item => (
          <ListItem
            key={item.value}
            {...omit(item, onlyIcon ? ['value', 'label'] : ['value'])}
          />
        ))}

        <SafeAreaView edges={['bottom']} />
      </ScrollView>
    </SafeAreaView>
  )
}
