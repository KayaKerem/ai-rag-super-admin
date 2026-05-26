import { z } from 'zod'
import { AGENT_IDS, CHANNEL_REGEX, ROLE_REGEX } from '../types'

export const routeBindingFormSchema = z.object({
  agentId: z.enum(AGENT_IDS, { message: 'Agent seçimi zorunlu' }),
  channel: z
    .string()
    .regex(CHANNEL_REGEX, 'Lowercase a-z ile başlamalı; sadece a-z, 0-9, _, - (max 50 karakter)'),
  peerKind: z.enum(['customer', 'user', 'system']),
  peerId: z.string().max(500, 'En fazla 500 karakter').nullable(),
  roles: z
    .array(z.string().regex(ROLE_REGEX, 'Sadece A-Z, a-z, 0-9, _, -'))
    .max(10, 'En fazla 10 rol'),
  priority: z
    .number()
    .int('Tam sayı olmalı')
    .min(0, 'En az 0')
    .max(1000, 'En fazla 1000'),
  notes: z.string().max(1000, 'En fazla 1000 karakter').nullable(),
})

export type RouteBindingFormValues = z.infer<typeof routeBindingFormSchema>
