import { EffectCallback, useEffect } from 'react'

const useEffectOnce = (effect: EffectCallback) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [])
}

export default useEffectOnce

// const profile = useAtomValue(profileAtom)
// const shouldCache = !!profile

// const webViewRef = useRef<WebView>(null)

// useUpdateEffect(() => {
//   if (!shouldCache) {
//     console.log(111)

//     v2exMessage.reloadWebview()
//   }
// }, [shouldCache])
