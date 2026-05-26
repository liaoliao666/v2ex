import { useAtomValue } from 'jotai'
import { Platform, Text } from 'react-native'
import {
  getNativePropsForTNode,
  useInternalRenderer,
} from 'react-native-render-html'
import type {
  CustomTextualRenderer,
  TDefaultRendererProps,
} from 'react-native-render-html'
import { UITextView } from 'react-native-uitextview'

import { uiAtom } from '@/jotai/uiAtom'

const TextRenderer: CustomTextualRenderer = props => {
  const { colors } = useAtomValue(uiAtom)

  const { rendererProps } = useInternalRenderer('a', props)
  const renderProps = getNativePropsForTNode(
    rendererProps as TDefaultRendererProps<typeof props.tnode>
  )

  if (Platform.OS === 'ios' && renderProps.selectable) {
    return (
      <UITextView
        uiTextView
        {...renderProps}
        selectionColor={colors.primary}
      />
    )
  }

  return <Text selectionColor={colors.primary} {...renderProps} />
}

export default TextRenderer
