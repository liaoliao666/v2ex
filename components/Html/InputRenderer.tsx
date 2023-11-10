import { load } from 'cheerio'
import { useMemo } from 'react'
import { CustomBlockRenderer } from 'react-native-render-html'

const InputRenderer: CustomBlockRenderer = ({ tnode }) => {
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

  return isCheckbox
    ? isChecked
      ? `▣`
      : `▢`
    : isRadio
    ? isChecked
      ? `◉`
      : `◎`
    : null
}

export default InputRenderer
