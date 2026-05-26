import { z } from 'zod'

export const agentRouteBindingSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  channel: z.string(),
  peerKind: z.enum(['customer', 'user', 'system']),
  peerId: z.string().nullable(),
  roles: z.array(z.string()),
  priority: z.number(),
  notes: z.string().nullable(),
  versionSeq: z.number(),
  createdByUserId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const agentRouteBindingListSchema = z.object({
  items: z.array(agentRouteBindingSchema),
  total: z.number(),
})
