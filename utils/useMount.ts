import { EffectCallback, useEffect } from 'react'

export function useMount(effect: EffectCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}
