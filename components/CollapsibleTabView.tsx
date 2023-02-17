// TODO
import { ReactNode, RefObject, createRef, useState } from 'react'
import { Animated, ScrollView, ScrollViewProps, View } from 'react-native'
import {
  Route,
  SceneRendererProps,
  TabBar,
  TabView,
  TabViewProps,
} from 'react-native-tab-view'

export interface CollapsibleTabView<T extends Route>
  extends Omit<TabViewProps<T>, 'renderScene'> {
  renderHeader: () => ReactNode
  renderScene: (
    sceneProps: SceneRendererProps & {
      route: T
      scrollViewProps: {
        ref: RefObject<ScrollView>
        contentContainerStyle: ScrollViewProps
      }
    }
  ) => ReactNode
}

export function CollapsibleTabView<T extends Route>({
  renderTabBar = tabBarProps => <TabBar {...tabBarProps} />,
  renderHeader,
  renderScene,
  navigationState,
  ...props
}: CollapsibleTabView<T>) {
  //   const [headerHeight, setHeaderHeight] = useState(0)

  const [refs] = useState<Record<string, RefObject<ScrollView>>>({})

  return (
    <TabView
      {...props}
      navigationState={navigationState}
      renderTabBar={tabBarProps => (
        <Animated.View>
          <View pointerEvents="box-none">{renderHeader()}</View>

          <View pointerEvents="box-none">{renderTabBar(tabBarProps)}</View>
        </Animated.View>
      )}
      renderScene={sceneProps => {
        const scrollViewProps = {
          ref:
            refs[sceneProps.route.key] ||
            (refs[sceneProps.route.key] = createRef<ScrollView>()),
          contentContainerStyle: {},
        }
        return renderScene({
          scrollViewProps,
          ...sceneProps,
        })
      }}
    />
  )
}
