import { useAtomValue } from 'jotai'
import { uniqBy } from 'lodash-es'
import { useCallback, useMemo } from 'react'
import { FlatList, ListRenderItem, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import LoadingIndicator from '@/components/LoadingIndicator'
import NavBar from '@/components/NavBar'
import {
  FallbackComponent,
  withQuerySuspense,
} from '@/components/QuerySuspense'
import StyledActivityIndicator from '@/components/StyledActivityIndicator'
import StyledRefreshControl from '@/components/StyledRefreshControl'
import TopicItem from '@/components/topic/TopicItem'
import { colorSchemeAtom } from '@/jotai/themeAtom'
import { useMyTopics } from '@/servicies/topic'
import { Topic } from '@/servicies/types'
import tw from '@/utils/tw'
import { useRefreshByUser } from '@/utils/useRefreshByUser'

export default withQuerySuspense(MyTopicsScreen, {
  Loading: () => (
    <View style={tw`flex-1`}>
      <NavBar title="主题收藏" />
      <LoadingIndicator />
    </View>
  ),
  fallbackRender: props => (
    <View style={tw`flex-1`}>
      <NavBar title="主题收藏" />
      <FallbackComponent {...props} />
    </View>
  ),
})

function MyTopicsScreen() {
  const { data, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMyTopics({
      suspense: true,
    })

  const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

  const renderItem: ListRenderItem<Topic> = useCallback(
    ({ item }) => <TopicItem key={item.id} topic={item} />,
    []
  )

  const flatedData = useMemo(
    () => uniqBy(data?.pages.map(page => page.list).flat(), 'id'),
    [data?.pages]
  )

  const colorScheme = useAtomValue(colorSchemeAtom)

  return (
    <View style={tw`flex-1`}>
      <NavBar title="主题收藏" />

      <FlatList
        key={colorScheme}
        data={flatedData}
        refreshControl={
          <StyledRefreshControl
            refreshing={isRefetchingByUser}
            onRefresh={refetchByUser}
          />
        }
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          <SafeAreaView edges={['bottom']}>
            {isFetchingNextPage ? (
              <StyledActivityIndicator style={tw`py-4`} />
            ) : null}
          </SafeAreaView>
        }
      />
    </View>
  )
}
