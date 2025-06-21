import { Slider } from '@react-native-assets/slider'
import { transparentize } from 'color2k'
import { compact } from 'lodash-es'
import { useMemo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import NavBar, { useNavBarHeight } from '@/components/NavBar'
import Separator from '@/components/Separator'
import StyledBlurView from '@/components/StyledBlurView'
import StyledButton from '@/components/StyledButton'
import { store } from '@/jotai/store'
import { colorSchemeAtom, themeAtom } from '@/jotai/themeAtom'
import {
  ThemeColors,
  defaultColors,
  fontScaleAtom,
  getUI,
  themeColorsMap,
  themeNameAtom,
} from '@/jotai/uiAtom'
import { navigation } from '@/navigation/navigationRef'
import tw from '@/utils/tw'
import { useScreenWidth } from '@/utils/useScreenWidth'

const DEFAULT_KEY = `default`

const topic = {
  id: 921903,
  last_reply_by: 'iliaoliao',
  last_touched: '215 天前',
  member: {
    username: 'iliaoliao',
  },
  node: {
    name: 'create',
    title: '分享创造',
  },
  pin_to_top: false,
  reply_count: 131,
  title: '[V2Fun] V2EX 好看的第三方客户端，原生 App，支持夜间模式。',
  votes: 7,
}

export default function CustomizeThemeScreen() {
  const parentWidth = useScreenWidth() - 24
  const itemWidth = parentWidth / Math.ceil(parentWidth / 100)
  const itemHeight = 36
  const navbarHeight = useNavBarHeight()
  const [colorScheme, setColorScheme] = useState(store.get(colorSchemeAtom)!)
  const [themeName, setThemeName] = useState({})
  const [fontScale, setFontScale] = useState(2)

  const { colors, fontSize } = useMemo(
    () => getUI(themeName, fontScale, colorScheme),
    [themeName, fontScale, colorScheme]
  )

  function renderItem(
    themeInfo: ThemeColors,
    nextColorScheme: 'dark' | 'light'
  ) {
    const key = themeInfo.name || DEFAULT_KEY

    return (
      <TouchableOpacity
        style={tw.style(
          `w-[${itemWidth}px] h-[${itemHeight}px] px-1 flex-row justify-center items-center`
        )}
        onPress={() => {
          setColorScheme(nextColorScheme)
          setThemeName({
            ...themeName,
            [nextColorScheme]: key === DEFAULT_KEY ? undefined : key,
          })
        }}
        key={key}
      >
        <View
          style={tw.style(
            `w-[${
              itemWidth - 8
            }px] h-[${itemHeight}px] items-center rounded-full justify-center`,
            `bg-[${themeInfo.base100 ?? colors.base100}]`,
            `border-[${colors.divider}] border rounded-full`
          )}
        >
          <Text
            style={tw.style(
              `text-[${(themeInfo as any).primary ?? colors.primary}]`,
              fontSize.medium
            )}
          >
            {themeInfo.label}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  function renderSubtitle(subtitle: string) {
    return (
      <View
        style={tw`py-3 px-4 border-t border-solid border-[${colors.divider}]`}
      >
        <Text
          style={tw`text-[${colors.foreground}] ${fontSize.xlarge} font-medium`}
        >
          {subtitle}
        </Text>
      </View>
    )
  }

  return (
    <View style={tw`flex-1 bg-[${colors.base100}]`}>
      <ScrollView>
        <View style={{ height: navbarHeight }} />
        <View style={tw`px-4 py-3 flex-row items-center`}>
          <Text style={tw`text-[${colors.default}] ${fontSize.small}`}>
            管理你的字体大小、颜色和背景。
          </Text>
        </View>

        <View style={tw`px-4 py-3 flex-row bg-[${colors.base100}]`}>
          <View>
            <View style={tw`pr-3`}>
              <View style={tw`w-6 h-6 rounded-full bg-[${colors.base300}]`} />
            </View>
          </View>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row gap-2`}>
              <Text
                style={tw`text-[${colors.foreground}] ${fontSize.medium} flex-shrink`}
                numberOfLines={1}
              >
                {topic.member?.username}
              </Text>

              {!!topic.node?.title && (
                <Text
                  style={tw`bg-[${colors.base200}] text-[${colors.default}] ${fontSize.small} px-1 py-0.5 rounded overflow-hidden`}
                >
                  {topic.node?.title}
                </Text>
              )}
            </View>

            <Text
              style={tw.style(
                `${fontSize.medium} pt-1 font-medium text-[${colors.foreground}]`
              )}
            >
              {topic.title}
            </Text>

            <Separator style={tw`mt-1`}>
              {compact([
                !!topic.votes && (
                  <Text
                    key="votes"
                    style={tw`text-[${colors.default}] ${fontSize.small}`}
                  >
                    {`${topic.votes} 赞同`}
                  </Text>
                ),
                !!topic.reply_count && (
                  <Text
                    key="replies"
                    style={tw`text-[${colors.default}] ${fontSize.small}`}
                  >
                    {`${topic.reply_count} 回复`}
                  </Text>
                ),
                <Text
                  key="last_touched"
                  style={tw`text-[${colors.default}] ${fontSize.small}`}
                >
                  {topic.last_touched}
                </Text>,
                !!topic.last_reply_by && (
                  <Text
                    key="last_reply_by"
                    style={tw`text-[${colors.foreground}] ${fontSize.small} flex-1`}
                    numberOfLines={1}
                  >
                    <Text
                      style={tw`text-[${colors.default}] ${fontSize.small}`}
                    >
                      最后回复于
                    </Text>
                    {topic.last_reply_by}
                  </Text>
                ),
              ])}
            </Separator>
          </View>
        </View>

        {renderSubtitle('字体')}

        <View style={tw`p-4 flex-row items-center`}>
          <Text style={tw`text-[${colors.foreground}] text-[13px]`}>Aa</Text>
          <View style={tw`flex-1 px-5`}>
            <Slider
              value={fontScale} // set the current slider's value
              onValueChange={setFontScale}
              minimumValue={0} // Minimum value
              maximumValue={4} // Maximum value
              step={1} // The step for the slider (0 means that the slider will handle any decimal value within the range [min, max])
              minimumTrackTintColor={colors.primary} // The track color before the current value
              maximumTrackTintColor={transparentize(colors.primary, 0.5)} // The track color after the current value
              thumbTintColor={colors.primary} // The color of the slider's thumb
              thumbStyle={undefined} // Override the thumb's style
              trackStyle={undefined} // Override the tracks' style
              minTrackStyle={undefined} // Override the tracks' style for the minimum range
              maxTrackStyle={undefined} // Override the tracks' style for the maximum range
              vertical={false} // If true, the slider will be drawn vertically
              inverted={false} // If true, min value will be on the right, and max on the left
              enabled={true} // If false, the slider won't respond to touches anymore
              trackHeight={4} // The track's height in pixel
              thumbSize={15} // The thumb's size in pixel
              thumbImage={undefined} // An image that would represent the thumb
              slideOnTap={true} // If true, touching the slider will update it's value. No need to slide the thumb.
              onSlidingStart={undefined} // Called when the slider is pressed. The type is (value: number) => void
              onSlidingComplete={undefined} // Called when the press is released. The type is (value: number) => void
              CustomThumb={undefined} // Provide your own component to render the thumb. The type is a component: ({ value: number }) => JSX.Element
              CustomMark={undefined} // Provide your own component to render the marks. The type is a component: ({ value: number; active: boolean }) => JSX.Element ; value indicates the value represented by the mark, while active indicates wether a thumb is currently standing on the mark
            />
          </View>
          <Text style={tw`text-[${colors.foreground}] text-[19px]`}>Aa</Text>
        </View>

        {renderSubtitle('浅色')}

        <View style={tw`flex-row flex-wrap px-3 gap-y-2 py-4`}>
          {[
            {
              ...Object.fromEntries(
                Object.entries(defaultColors).map(([key, obj]) => [
                  key,
                  obj.light,
                ])
              ),
              label: '默认',
              name: DEFAULT_KEY,
            },
            ...Object.values(themeColorsMap).filter(
              themeInfo => themeInfo.colorScheme === 'light'
            ),
          ].map(themeInfo => renderItem(themeInfo as any, 'light'))}
        </View>

        {renderSubtitle('深色')}

        <View style={tw`flex-row flex-wrap px-3 gap-y-2 py-4`}>
          {[
            {
              ...Object.fromEntries(
                Object.entries(defaultColors).map(([key, obj]) => [
                  key,
                  obj.dark,
                ])
              ),
              label: '默认',
              name: DEFAULT_KEY,
            },
            ...Object.values(themeColorsMap).filter(
              themeInfo => themeInfo.colorScheme === 'dark'
            ),
          ].map(themeInfo => renderItem(themeInfo as any, 'dark'))}
        </View>

        <SafeAreaView edges={['bottom']} />
      </ScrollView>

      <View style={tw`absolute top-0 inset-x-0`}>
        <StyledBlurView style={tw`absolute inset-0`} />
        <NavBar
          style={{
            backgroundColor: colors.base100,
          }}
          tintColor={colors.foreground}
          right={
            <StyledButton
              shape="rounded"
              onPress={() => {
                if (store.get(colorSchemeAtom) !== colorScheme) {
                  store.set(themeAtom, colorScheme)
                }
                store.set(themeNameAtom, themeName)
                store.set(fontScaleAtom, fontScale)
                navigation.goBack()
              }}
            >
              完成
            </StyledButton>
          }
        >
          <Text
            style={tw.style(
              fontSize.large,
              `text-[${colors.foreground}] font-semibold`
            )}
            numberOfLines={1}
          >
            主题设置
          </Text>
        </NavBar>
      </View>
    </View>
  )
}
