// lib/tailwind.js
import { create } from 'twrnc'

// create the customized version...
const tw = create(require('../tailwind.config.js')) // <- your path may differ

tw.color = utils => {
  const styleObj = tw.style(utils)
  const color =
    styleObj.color || styleObj.backgroundColor || styleObj.borderColor
  return typeof color === `string` ? color : undefined
}

// ... and then this becomes the main function your app uses
export default tw
