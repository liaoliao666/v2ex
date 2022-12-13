// lib/tailwind.js
import { create } from 'twrnc'

// create the customized version...
const tw = create(require('../tailwind.config.js')) // <- your path may differ

// ... and then this becomes the main function your app uses
export default tw
