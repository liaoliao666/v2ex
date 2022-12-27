import { EffectCallback, useEffect } from 'react'

const useEffectOnce = (effect: EffectCallback) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}

export default useEffectOnce
