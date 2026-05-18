export type PeerKind = 'customer' | 'user'

export interface AgentRouteBinding {
  id: string
  agentId: string
  channel: string
  peerKind: PeerKind
  peerId: string | null
  roles: string[]
  priority: number
  notes: string | null
  versionSeq: number
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface AgentRouteBindingListResponse {
  items: AgentRouteBinding[]
  total: number
}

export interface CreateAgentRouteBindingRequest {
  agentId: string
  channel: string
  peerKind: PeerKind
  peerId?: string | null
  roles?: string[]
  priority?: number
  notes?: string | null
}

export interface UpdateAgentRouteBindingRequest {
  expectedVersionSeq: number
  agentId?: string
  channel?: string
  peerKind?: PeerKind
  peerId?: string | null
  roles?: string[]
  priority?: number
  notes?: string | null
}

// Well-known agents (Backend doc 21 §Veri Modeli > Varsayilan Tohumlanmis Baglamalar).
// AGENT_IDS is a tuple literal so Zod's z.enum can infer the union correctly.
export const AGENT_IDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
] as const
export type AgentId = (typeof AGENT_IDS)[number]

export const AGENT_OPTIONS: { id: AgentId; label: string }[] = [
  { id: AGENT_IDS[0], label: 'Conversation' },
  { id: AGENT_IDS[1], label: 'Quote' },
  { id: AGENT_IDS[2], label: 'Search' },
  { id: AGENT_IDS[3], label: 'Internal RAG' },
]

export const KNOWN_CHANNELS = ['whatsapp', 'telegram', 'dashboard'] as const
export type KnownChannel = (typeof KNOWN_CHANNELS)[number]

export const PEER_KIND_OPTIONS: { value: PeerKind; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'user', label: 'User' },
]

export const ROLE_REGEX = /^[A-Za-z0-9_-]{1,50}$/
export const CHANNEL_REGEX = /^[a-z][a-z0-9_-]{0,49}$/

export interface AgentRouteBindingsFilters {
  agentId: string | null
  channel: string | null
  peerKind: PeerKind | null
}

export function getAgentLabel(agentId: string): string {
  const found = AGENT_OPTIONS.find((a) => a.id === agentId)
  if (found) return found.label
  return `${agentId.slice(0, 8)}…`
}

export function normalizePeerId(input: string): string | null {
  const trimmed = input.trim()
  return trimmed === '' ? null : trimmed
}

export function isKnownChannel(c: string): c is KnownChannel {
  return (KNOWN_CHANNELS as readonly string[]).includes(c)
}
