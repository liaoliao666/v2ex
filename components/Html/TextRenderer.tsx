import {
  getNativePropsForTNode,
  useInternalRenderer,
} from '@native-html/render'
import type {
  CustomTextualRenderer,
  TDefaultRendererProps,
} from '@native-html/render'
import { useAtomValue } from 'jotai'
import { Platform, Text } from 'react-native'
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
        numberOfLines={0}
        ellipsizeMode="clip"
        selectionColor={colors.primary}
      />
    )
  }

  return <Text selectionColor={colors.primary} {...renderProps} />
}

export default TextRenderer
