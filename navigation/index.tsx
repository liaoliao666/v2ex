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
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as SplashScreen from 'expo-splash-screen'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { Platform } from 'react-native'

import Profile from '@/components/Profile'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import GItHubMDScreen from '@/screens/GItHubMDScreen'
import HomeScreen from '@/screens/HomeScreen'
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
import SettingScreen from '@/screens/SettingScreen'
import SortTabsScreen from '@/screens/SortTabsScreen'
import TopicDetailScreen from '@/screens/TopicDetailScreen'
import WebSigninScreen from '@/screens/WebSigninScreen'
import WriteTopicScreen from '@/screens/WriteTopicScreen'
import { RootStackParamList } from '@/types'
import tw from '@/utils/tw'

import linking from './LinkingConfiguration'
import { navigationRef } from './navigationRef'

export default function Navigation() {
  const colorScheme = useAtomValue(colorSchemeAtom)

  const theme = useMemo(() => {
    const colors = {
      primary: tw.color(`text-primary-focus`)!,
      text: tw.color(`text-tint-primary`)!,
      border: tw.color(`border-tint-border`)!,
      card: tw.color(`bg-body-1`)!,
      background: tw.color(`bg-body-1`)!,
    }

    return colorScheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DefaultTheme.colors,
            ...colors,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            ...colors,
          },
        }
  }, [colorScheme])

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      theme={theme}
      onReady={SplashScreen.hideAsync}
    >
      <StackNavigator />
    </NavigationContainer>
  )
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>()

function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Root"
      screenOptions={{
        headerShown: false,
        fullScreenGestureEnabled: true,
        animation: Platform.OS === 'android' ? 'slide_from_right' : undefined,
      }}
    >
      <Stack.Screen
        name="Root"
        component={DrawerNavigator}
        options={{
          animation: 'none',
        }}
      />

      <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />

      <Stack.Screen
        name="RelatedReplies"
        options={{
          presentation: 'modal',
        }}
        component={RelatedRepliesScreen}
      />

      <Stack.Screen
        name="SearchReplyMember"
        options={{
          presentation: 'modal',
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
        options={{
          animation: 'none',
        }}
        component={SearchScreen}
      />

      <Stack.Screen
        name="SearchOptions"
        options={{
          presentation: 'modal',
          orientation: 'portrait',
        }}
        component={SearchOptionsScreen}
      />

      <Stack.Screen
        name="SearchNode"
        options={{
          presentation: 'modal',
        }}
        component={SearchNodeScreen}
      />

      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen name="WriteTopic" component={WriteTopicScreen} />

      <Stack.Screen name="NavNodes" component={NavNodesScreen} />

      <Stack.Screen name="NotFound" component={NotFoundScreen} />

      <Stack.Screen
        options={{
          presentation: 'fullScreenModal',
          orientation: 'portrait',
        }}
        name="SortTabs"
        component={SortTabsScreen}
      />

      <Stack.Screen name="Setting" component={SettingScreen} />

      <Stack.Screen name="Rank" component={RankScreen} />
    </Stack.Navigator>
  )
}

const Drawer = createDrawerNavigator()

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      drawerContent={() => <Profile />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="HomeScreen" component={HomeScreen} />
    </Drawer.Navigator>
  )
}
