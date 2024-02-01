/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { createDrawerNavigator } from '@react-navigation/drawer'
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native'
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack'
import * as SplashScreen from 'expo-splash-screen'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { Platform } from 'react-native'

import PageLayout from '@/components/PageLayout'
import Profile from '@/components/Profile'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { uiAtom } from '@/jotai/uiAtom'
import BlackListScreen from '@/screens/BlackListScreen'
import ConfigureDomainScreen from '@/screens/ConfigureDomainScreen'
import CustomizeThemeScreen from '@/screens/CustomizeThemeScreen'
import GItHubMDScreen from '@/screens/GItHubMDScreen'
import HomeScreen from '@/screens/HomeScreen'
import HotestTopicsScreen from '@/screens/HotestTopicsScreen'
import ImgurConfigScreen from '@/screens/ImgurConfigScreen'
import LoginScreen from '@/screens/LoginScreen'
import MemberDetailScreen from '@/screens/MemberDetailScreen'
import MyFollowingScreen from '@/screens/MyFollowingScreen'
import MyNodesScreen from '@/screens/MyNodesScreen'
import MyTopicsScreen from '@/screens/MyTopicsScreen'
import NavNodesScreen from '@/screens/NavNodesScreen'
import NodeTopicsScreen from '@/screens/NodeTopicsScreen'
import NotFoundScreen from '@/screens/NotFoundScreen'
import NotificationsScreen from '@/screens/NotificationsScreen'
import RankScreen from '@/screens/RankScreen'
import RecentTopicScreen from '@/screens/RecentTopicScreen'
import RelatedRepliesScreen from '@/screens/RelatedRepliesScreen'
import SearchNodeScreen from '@/screens/SearchNodeScreen'
import SearchOptionsScreen from '@/screens/SearchOptionsScreen'
import SearchReplyMemberScreen from '@/screens/SearchReplyMemberScreen'
import SearchScreen from '@/screens/SearchScreen'
import SelectableTextScreen from '@/screens/SelectableTextScreen'
import SettingScreen from '@/screens/SettingScreen'
import SortTabsScreen from '@/screens/SortTabsScreen'
import TopicDetailScreen from '@/screens/TopicDetailScreen'
import WebSigninScreen from '@/screens/WebSigninScreen'
import WebviewScreen from '@/screens/WebviewScreen'
import WriteTopicScreen from '@/screens/WriteTopicScreen'
import { RootStackParamList } from '@/types'
import { sleep } from '@/utils/sleep'
import { useIsLargeTablet, useIsTablet } from '@/utils/tablet'
import { useNavigationBar } from '@/utils/useNavigationBar'

import linking from './LinkingConfiguration'
import { navigationRef } from './navigationRef'

export default function Navigation() {
  const colorScheme = useAtomValue(colorSchemeAtom)
  const { colors } = useAtomValue(uiAtom)

  const theme = useMemo(() => {
    const themeColors = {
      primary: colors.primary,
      text: colors.foreground,
      border: colors.divider,
      card: colors.base100,
      background: colors.base100,
    }

    return colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DefaultTheme.colors,
            ...themeColors,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            ...themeColors,
          },
        }
  }, [colors, colorScheme])

  const [readyAndroid, setReadyAndroid] = useState(false)
  useNavigationBar(readyAndroid)

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={theme}
      onReady={async () => {
        await sleep(300)
        await SplashScreen.hideAsync()

        if (Platform.OS === 'android') {
          setReadyAndroid(true)
        }
      }}
    >
      <PageLayout>
        <StackNavigator />
      </PageLayout>
    </NavigationContainer>
  )
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>()

const androidSlideFromBottomOptions: NativeStackNavigationOptions =
  Platform.OS === 'android'
    ? {
        presentation: 'transparentModal',
        animation: 'slide_from_bottom',
      }
    : {}

function RootScreen() {
  const isLargeTablet = useIsLargeTablet()
  return isLargeTablet ? <NotFoundScreen /> : <DrawerNavigator />
}

function StackNavigator() {
  const isTablet = useIsTablet()
  const isLargeTablet = useIsLargeTablet()

  return (
    <Stack.Navigator
      initialRouteName={'Root'}
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
        animation:
          Platform.OS === 'android'
            ? isTablet
              ? 'none'
              : 'slide_from_right'
            : undefined,
        orientation: !isTablet ? 'portrait' : undefined,
      }}
    >
      <Stack.Screen
        name="Root"
        component={RootScreen}
        options={{
          animation: 'none',
        }}
      />

      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />

      <Stack.Screen
        name="RelatedReplies"
        options={{
          presentation: 'modal',
          ...androidSlideFromBottomOptions,
        }}
        component={RelatedRepliesScreen}
      />

      <Stack.Screen
        name="SearchReplyMember"
        options={{
          presentation: 'modal',
          ...androidSlideFromBottomOptions,
        }}
        component={SearchReplyMemberScreen}
      />

      <Stack.Screen name="NodeTopics" component={NodeTopicsScreen} />

      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />

      <Stack.Screen name="MyNodes" component={MyNodesScreen} />

      <Stack.Screen name="MyTopics" component={MyTopicsScreen} />

      <Stack.Screen name="MyFollowing" component={MyFollowingScreen} />

      <Stack.Screen name="Notifications" component={NotificationsScreen} />

      <Stack.Screen name="GItHubMD" component={GItHubMDScreen} />

      <Stack.Screen name="WebSignin" component={WebSigninScreen} />

      <Stack.Screen name="RecentTopic" component={RecentTopicScreen} />

      <Stack.Screen
        name="Search"
        options={
          isLargeTablet
            ? undefined
            : {
                animation: 'none',
              }
        }
        component={SearchScreen}
      />

      <Stack.Screen
        name="SearchOptions"
        options={{
          presentation: 'modal',
          ...androidSlideFromBottomOptions,
        }}
        component={SearchOptionsScreen}
      />

      <Stack.Screen
        name="SearchNode"
        options={{
          presentation: 'modal',
          ...androidSlideFromBottomOptions,
        }}
        component={SearchNodeScreen}
      />

      <Stack.Screen
        name="SelectableText"
        options={{
          presentation: 'modal',
        }}
        component={SelectableTextScreen}
      />

      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="WriteTopic" component={WriteTopicScreen} />

      <Stack.Screen name="NavNodes" component={NavNodesScreen} />

      <Stack.Screen name="NotFound" component={NotFoundScreen} />

      <Stack.Screen
        options={
          isTablet
            ? undefined
            : {
                presentation: 'fullScreenModal',
                ...androidSlideFromBottomOptions,
              }
        }
        name="SortTabs"
        component={SortTabsScreen}
      />

      <Stack.Screen name="Setting" component={SettingScreen} />

      <Stack.Screen name="Rank" component={RankScreen} />

      <Stack.Screen name="BlankList" component={BlackListScreen} />

      <Stack.Screen
        name="Webview"
        component={WebviewScreen}
        options={{
          fullScreenGestureEnabled: false,
        }}
      />

      <Stack.Screen name="ImgurConfig" component={ImgurConfigScreen} />

      <Stack.Screen name="HotestTopics" component={HotestTopicsScreen} />

      <Stack.Screen name="ConfigureDomain" component={ConfigureDomainScreen} />

      <Stack.Screen
        name="CustomizeTheme"
        component={CustomizeThemeScreen}
        options={{
          fullScreenGestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  )
}

const Drawer = createDrawerNavigator()

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={() => <Profile />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
    </Drawer.Navigator>
  )
}
