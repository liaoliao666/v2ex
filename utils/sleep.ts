export const sleep = (ms: number) =>
  new Promise<void>(ok => setTimeout(() => ok(), ms))
