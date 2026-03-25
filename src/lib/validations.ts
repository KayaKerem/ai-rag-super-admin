import { z } from 'zod'

export const s3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  keyPrefix: z.string().optional(),
})

export const cdnConfigSchema = z.object({
  enabled: z.boolean().optional(),
  domain: z.string().optional(),
  keyPairId: z.string().optional(),
  privateKey: z.string().optional(),
  ttlSec: z.coerce.number().optional(),
})

export const mailConfigSchema = z.object({
  apiKey: z.string().optional(),
  fromAddress: z.string().optional(),
  fromName: z.string().optional(),
  replyTo: z.string().optional(),
})

export const aiConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
  model: z.string().optional(),
  compactionModel: z.string().optional(),
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  requestTimeoutMs: z.coerce.number().optional(),
  budgetUsd: z.coerce.number().optional(),
  fallbackProvider: z.enum(['anthropic', 'openai', 'gemini']).nullable().optional(),
})

export const embeddingConfigSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  dimensions: z.coerce.number().optional(),
})

export const langfuseConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseUrl: z.string().optional(),
})

export const triggerConfigSchema = z.object({
  projectRef: z.string().optional(),
  secretKey: z.string().optional(),
})

export const limitsConfigSchema = z.object({
  maxStorageMb: z.coerce.number().optional(),
  maxFileSizeMb: z.coerce.number().optional(),
  historyTokenBudget: z.coerce.number().optional(),
  compactionTriggerTokens: z.coerce.number().optional(),
})

export const pricingConfigSchema = z.object({
  s3PerGbMonthUsd: z.coerce.number().optional(),
  cdnPerGbTransferUsd: z.coerce.number().optional(),
  triggerPerTaskUsd: z.coerce.number().optional(),
})

export const configBlockSchemas = {
  aiConfig: aiConfigSchema,
  s3Config: s3ConfigSchema,
  cdnConfig: cdnConfigSchema,
  mailConfig: mailConfigSchema,
  embeddingConfig: embeddingConfigSchema,
  langfuseConfig: langfuseConfigSchema,
  triggerConfig: triggerConfigSchema,
  limitsConfig: limitsConfigSchema,
  pricingConfig: pricingConfigSchema,
} as const

export type ConfigBlockKey = keyof typeof configBlockSchemas
