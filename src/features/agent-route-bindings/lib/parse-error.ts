import axios from 'axios'
import type { PeerKind } from '../types'

export type RouteBindingErrorCode =
  | 'binding_version_conflict'
  | 'binding_duplicate'
  | 'binding_not_found'
  | 'invalid_agent_id'
  | 'platform_admin_required'
  | 'unknown'

const KNOWN_CODES: RouteBindingErrorCode[] = [
  'binding_version_conflict',
  'binding_duplicate',
  'binding_not_found',
  'invalid_agent_id',
  'platform_admin_required',
]

export interface BindingConflict {
  agentId: string
  channel: string
  peerKind: PeerKind
  peerId: string | null
  priority: number
}

export interface ParsedError {
  status: number
  code: RouteBindingErrorCode
  message: string
  conflict?: BindingConflict
}

// Backend uses two distinct envelope shapes (see spec §5.2.1.1 smoke 2026-05-18):
//   Custom service-thrown:  { error: "<code>", conflict: {...} }
//   Nest HttpException:     { message: "<code>", error: "Conflict", statusCode: 409 }
// Discriminate by reading `error` field first (custom), then `message` (HttpException).
export function parseRouteBindingError(error: unknown): ParsedError {
  if (!axios.isAxiosError(error) || !error.response) {
    return { status: 0, code: 'unknown', message: 'Ağ hatası' }
  }
  const status = error.response.status
  const body = error.response.data as Record<string, unknown> | undefined

  const errorField = typeof body?.error === 'string' ? body.error : ''
  const messageField = typeof body?.message === 'string' ? body.message : ''

  const matched =
    KNOWN_CODES.find((c) => c === errorField) ??
    KNOWN_CODES.find((c) => c === messageField)
  const code: RouteBindingErrorCode = matched ?? 'unknown'

  const message = messageField || errorField || `HTTP ${status}`
  const conflict =
    typeof body?.conflict === 'object' && body.conflict !== null
      ? (body.conflict as BindingConflict)
      : undefined
  return { status, code, message, conflict }
}
