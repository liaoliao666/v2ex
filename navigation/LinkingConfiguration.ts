/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */
import { LinkingOptions } from '@react-navigation/native'
import { Linking } from 'react-native'

import { RootStackParamList } from '../types'

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['v2fun://'],
  config: {
    screens: {
      Search: 'search/:query?',
      TopicDetail: 'topic/:id',
      NotFound: '*',
    },
  },
}

export default linking
