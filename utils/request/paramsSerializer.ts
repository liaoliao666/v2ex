export function paramsSerializer(params: Record<string, unknown>) {
  return Object.entries(params)
    .flatMap(([key, val]) =>
      (Array.isArray(val) ? val : [val]).map(
        v => `${key}=${encodeURIComponent(v ?? '')}`
      )
    )
    .join('&')
}
