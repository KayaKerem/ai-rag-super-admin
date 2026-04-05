import { z } from 'zod'

// Coerce non-empty strings to number, treat empty/blank as undefined
const optNum = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional(),
)

export const s3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  keyPrefix: z.string().optional(),
  putTtlSec: optNum,
  getTtlSec: optNum,
  deleteTtlSec: optNum,
  configCacheTtlMs: optNum,
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
})

export const cdnConfigSchema = z.object({
  enabled: z.boolean().optional(),
  domain: z.string().optional(),
  keyPairId: z.string().optional(),
  privateKey: z.string().optional(),
  ttlSec: optNum,
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
  language: z.enum(['tr', 'en']).optional(),
  summaryModel: z.string().optional(),
  requestTimeoutMs: optNum,
  budgetUsd: optNum,
  budgetDowngradeThresholdPct: optNum,
  citationGateMode: z.enum(['off', 'warn', 'block']).optional(),
  hybridRrfK: optNum,
  maxOutputTokensRetryCap: optNum,
  vectorSimilarityThreshold: optNum,
  qualityEvalEnabled: z.boolean().optional(),
  qualityEvalModel: z.string().optional(),
})

export const embeddingConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().optional(),
  dimensions: optNum,
})

export const langfuseConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseUrl: z.string().optional(),
  environment: z.string().optional(),
  promptManagementEnabled: z.boolean().optional(),
  promptLabel: z.string().optional(),
  promptCacheTtlMs: optNum,
})

export const triggerConfigSchema = z.object({
  projectRef: z.string().optional(),
  secretKey: z.string().optional(),
  workerEnabled: z.boolean().optional(),
})

export const limitsConfigSchema = z.object({
  maxStorageMb: optNum,
  maxFileSizeMb: optNum,
  supportedFormats: z.array(z.string()).optional(),
  chunkMaxChars: optNum,
  chunkOverlapChars: optNum,
  embeddingBatchSize: optNum,
  historyTokenBudget: optNum,
  compactionTriggerTokens: optNum,
  searchDefaultLimit: optNum,
  batchMaxFiles: optNum,
  batchMaxTotalSizeMb: optNum,
  singleFileMaxSizeMb: optNum,
  maxTagsPerDocument: optNum,
  maxTagLength: optNum,
  approvalTimeoutMinutes: optNum,
  queueConcurrencyExtract: optNum,
  queueConcurrencyIngest: optNum,
  queueConcurrencyAutoTag: optNum,
  crawlMaxPages: optNum,
  crawlMaxSources: optNum,
  crawlMinIntervalHours: optNum,
  crawlConcurrency: optNum,
  allowedConnectors: z.array(z.string()).optional(),
  autoSummarizeEnabled: z.boolean().optional(),
})

export const documentProcessingConfigSchema = z.object({
  textractEndpoint: z.string().optional(),
  supportedSourceKinds: z.array(z.string()).optional(),
  maxAttempts: optNum,
  syncTextractMaxSizeMb: optNum,
  workersEnabled: z.boolean().optional(),
})

export const crawlerConfigSchema = z.object({
  cloudflareAccountId: z.string().optional(),
  cloudflareApiToken: z.string().optional(),
  maxGlobalConcurrentCrawls: optNum,
})

export const pricingConfigSchema = z.object({
  s3PerGbMonthUsd: optNum,
  triggerPerTaskUsd: optNum,
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
