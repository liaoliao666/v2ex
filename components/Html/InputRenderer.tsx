import { load } from 'cheerio'
import { useMemo } from 'react'
import { Text } from 'react-native'
import { CustomBlockRenderer } from 'react-native-render-html'

const InputRenderer: CustomBlockRenderer = ({ tnode, style }) => {
  const { isCheckbox, isRadio, isChecked } = useMemo(() => {
    const $ = load(tnode.domNode as unknown as string)
    const $input = $('input')
    const type = $input.attr('type')

    return {
      isCheckbox: type === 'checkbox',
      isRadio: type === 'radio',
      isChecked: !!$input.attr('checked'),
    }
  }, [tnode.domNode])

  return isCheckbox || isRadio ? (
    <Text style={style}>
      {isCheckbox ? (isChecked ? `▣` : `▢`) : isChecked ? `◉` : `◎`}
    </Text>
  ) : null
}

export default InputRenderer
