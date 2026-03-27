import { z } from 'zod'

export const s3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  keyPrefix: z.string().optional(),
  putTtlSec: z.coerce.number().optional(),
  getTtlSec: z.coerce.number().optional(),
  deleteTtlSec: z.coerce.number().optional(),
  configCacheTtlMs: z.coerce.number().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
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
  model: z.string().optional(),
  compactionModel: z.string().optional(),
  titleModel: z.string().optional(),
  apiKey: z.string().optional(),
  requestTimeoutMs: z.coerce.number().optional(),
  budgetUsd: z.coerce.number().optional(),
  budgetDowngradeThresholdPct: z.coerce.number().optional(),
  citationGateMode: z.enum(['off', 'warn', 'block']).optional(),
  hybridRrfK: z.coerce.number().optional(),
  maxOutputTokensRetryCap: z.coerce.number().optional(),
  vectorSimilarityThreshold: z.coerce.number().optional(),
  qualityEvalEnabled: z.boolean().optional(),
  qualityEvalModel: z.string().optional(),
})

export const embeddingConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().optional(),
  dimensions: z.coerce.number().optional(),
})

export const langfuseConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseUrl: z.string().optional(),
  environment: z.string().optional(),
  promptManagementEnabled: z.boolean().optional(),
  promptLabel: z.string().optional(),
  promptCacheTtlMs: z.coerce.number().optional(),
})

export const triggerConfigSchema = z.object({
  projectRef: z.string().optional(),
  secretKey: z.string().optional(),
  workerEnabled: z.boolean().optional(),
})

export const limitsConfigSchema = z.object({
  maxStorageMb: z.coerce.number().optional(),
  maxFileSizeMb: z.coerce.number().optional(),
  supportedFormats: z.array(z.string()).optional(),
  chunkMaxChars: z.coerce.number().optional(),
  chunkOverlapChars: z.coerce.number().optional(),
  embeddingBatchSize: z.coerce.number().optional(),
  historyTokenBudget: z.coerce.number().optional(),
  compactionTriggerTokens: z.coerce.number().optional(),
  searchDefaultLimit: z.coerce.number().optional(),
  batchMaxFiles: z.coerce.number().optional(),
  batchMaxTotalSizeMb: z.coerce.number().optional(),
  singleFileMaxSizeMb: z.coerce.number().optional(),
  maxTagsPerDocument: z.coerce.number().optional(),
  maxTagLength: z.coerce.number().optional(),
  approvalTimeoutMinutes: z.coerce.number().optional(),
  queueConcurrencyExtract: z.coerce.number().optional(),
  queueConcurrencyIngest: z.coerce.number().optional(),
  queueConcurrencyAutoTag: z.coerce.number().optional(),
  crawlMaxPages: z.coerce.number().optional(),
  crawlMaxSources: z.coerce.number().optional(),
  crawlMinIntervalHours: z.coerce.number().optional(),
  crawlConcurrency: z.coerce.number().optional(),
})

export const documentProcessingConfigSchema = z.object({
  textractEndpoint: z.string().optional(),
  supportedSourceKinds: z.array(z.string()).optional(),
  maxAttempts: z.coerce.number().optional(),
  syncTextractMaxSizeMb: z.coerce.number().optional(),
  workersEnabled: z.boolean().optional(),
})

export const crawlerConfigSchema = z.object({
  cloudflareAccountId: z.string().optional(),
  cloudflareApiToken: z.string().optional(),
  maxGlobalConcurrentCrawls: z.coerce.number().optional(),
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
  documentProcessingConfig: documentProcessingConfigSchema,
  crawlerConfig: crawlerConfigSchema,
  pricingConfig: pricingConfigSchema,
} as const

export type ConfigBlockKey = keyof typeof configBlockSchemas
