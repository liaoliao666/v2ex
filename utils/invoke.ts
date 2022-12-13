export function invoke<T>(fn: () => T): T {
  return fn()
}
