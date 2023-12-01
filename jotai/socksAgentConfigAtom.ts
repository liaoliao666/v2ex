import { SocksProxyAgent } from 'socks-proxy-agent'

import { store } from '@/jotai/store'

import { atomWithAsyncStorage } from './utils/atomWithAsyncStorage'

export interface ProxyAgent {
  host: string
  port: string
  user?: string
  password?: string
}

export const socksAgentConfigAtom = atomWithAsyncStorage<{
  agents: ProxyAgent[]
  index: number
  enabled: boolean
}>('socksAgentConfig', {
  agents: [],
  index: 0,
  enabled: false,
})

let proxyOptions: string | undefined
let httpsAgent: SocksProxyAgent | undefined
let httpAgent = httpsAgent

export function getAgents() {
  try {
    const { agents, index, enabled } = store.get(socksAgentConfigAtom) || {}
    const agent = agents?.[index!]
    const nextProxyOptions =
      enabled && agent ? getProxyOptions(agent) : undefined

    if (proxyOptions !== nextProxyOptions) {
      proxyOptions = nextProxyOptions
      httpsAgent?.destroy()
      httpsAgent = proxyOptions ? new SocksProxyAgent(proxyOptions) : undefined
      httpAgent = httpsAgent
    }

    return { httpsAgent, httpAgent }
  } catch (error) {
    return {}
  }
}

function getProxyOptions(agent: ProxyAgent) {
  const auth =
    agent.user && agent.password
      ? `${agent.user}:${agent.password}`
      : agent.user
      ? agent.user
      : undefined

  return auth
    ? `socks5://${auth}@${agent.host}:${agent.port}`
    : `socks5://${agent.host}:${agent.port}`
}
