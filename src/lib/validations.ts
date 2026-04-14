import { z } from 'zod'

// Coerce non-empty strings to number, treat empty/blank as undefined
const optNum = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().optional(),
)

// Like optNum but enforces >= 0 — use for budgets, prices, and limits
const posNum = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
  z.number().min(0).optional(),
)

export const s3ConfigSchema = z.object({
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
  keyPrefix: z.string().optional(),
  putTtlSec: posNum,
  getTtlSec: posNum,
  deleteTtlSec: posNum,
  configCacheTtlMs: posNum,
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
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
  requestTimeoutMs: posNum,
  budgetUsd: posNum,
  budgetDowngradeThresholdPct: posNum,
  citationGateMode: z.enum(['off', 'warn', 'block']).optional(),
  hybridRrfK: posNum,
  maxOutputTokensRetryCap: posNum,
  vectorSimilarityThreshold: optNum,
  qualityEvalEnabled: z.boolean().optional(),
  qualityEvalModel: z.string().optional(),
  // Phase 2: Reranking
  rerankApiKey: z.string().optional(),
  rerankModel: z.string().optional(),
  // Phase 2: Web Search
  exaApiKey: z.string().optional(),
  webSearchTier: z.enum(['basic', 'deep', 'deep_reasoning']).optional(),
  // Phase 2: Advanced
  multiModelStepEnabled: z.boolean().optional(),
})

export const embeddingConfigSchema = z.object({
  model: z.string().optional(),
  apiKey: z.string().optional(),
  dimensions: posNum,
})

export const langfuseConfigSchema = z.object({
  enabled: z.boolean().optional(),
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  baseUrl: z.string().optional(),
  environment: z.string().optional(),
  promptManagementEnabled: z.boolean().optional(),
  promptLabel: z.string().optional(),
  promptCacheTtlMs: posNum,
})

export const triggerConfigSchema = z.object({
  projectRef: z.string().optional(),
  secretKey: z.string().optional(),
  workerEnabled: z.boolean().optional(),
})

export const limitsConfigSchema = z.object({
  maxStorageMb: posNum,
  maxFileSizeMb: posNum,
  supportedFormats: z.array(z.string()).optional(),
  chunkMaxChars: posNum,
  chunkOverlapChars: posNum,
  embeddingBatchSize: posNum,
  historyTokenBudget: posNum,
  compactionTriggerTokens: posNum,
  searchDefaultLimit: posNum,
  batchMaxFiles: posNum,
  batchMaxTotalSizeMb: posNum,
  singleFileMaxSizeMb: posNum,
  maxTagsPerDocument: posNum,
  maxTagLength: posNum,
  approvalTimeoutMinutes: posNum,
  queueConcurrencyExtract: posNum,
  queueConcurrencyIngest: posNum,
  queueConcurrencyAutoTag: posNum,
  crawlMaxPages: posNum,
  crawlMaxSources: posNum,
  crawlMinIntervalHours: posNum,
  crawlConcurrency: posNum,
  allowedConnectors: z.array(z.string()).optional(),
  autoSummarizeEnabled: z.boolean().optional(),
  maxLeads: posNum,
  maxPlaybookEntries: posNum,
  maxChannels: posNum,
  maxQuotes: posNum,
  maxQuotesPerLead: posNum,
})

export const documentProcessingConfigSchema = z.object({
  supportedSourceKinds: z.array(z.string()).optional(),
  maxAttempts: posNum,
  workersEnabled: z.boolean().optional(),
})

export const crawlerConfigSchema = z.object({
  cloudflareAccountId: z.string().optional(),
  cloudflareApiToken: z.string().optional(),
  maxGlobalConcurrentCrawls: posNum,
})

export const pricingConfigSchema = z.object({
  s3PerGbMonthUsd: posNum,
  triggerPerTaskUsd: posNum,
})

export const proactiveConfigSchema = z.object({
  enabled: z.boolean().optional(),
  freshnessEnabled: z.boolean().optional(),
  freshnessIntervalHours: posNum,
  gapEnabled: z.boolean().optional(),
  gapMinQueryCount: posNum,
  qualityEnabled: z.boolean().optional(),
  qualitySampleSize: posNum,
  monthlyBudgetUsd: posNum,
  notifyEmail: z.boolean().optional(),
})

const dayScheduleSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
}).nullable().optional()

export const workingHoursConfigSchema = z.object({
  enabled: z.boolean().optional(),
  timezone: z.string().optional(),
  schedule: z.object({
    '0': dayScheduleSchema,
    '1': dayScheduleSchema,
    '2': dayScheduleSchema,
    '3': dayScheduleSchema,
    '4': dayScheduleSchema,
    '5': dayScheduleSchema,
    '6': dayScheduleSchema,
  }).optional(),
  outsideHoursMessage: z.string().optional(),
})

export const dataRetentionConfigSchema = z.object({
  enabled: z.boolean().optional(),
  leadRetentionDays: posNum,
})

export const whatsAppConfigSchema = z.object({
  defaultTemplateName: z.string().optional(),
  defaultTemplateLanguage: z.string().optional(),
  typingIndicatorEnabled: z.boolean().optional(),
  welcomeMessages: z.object({
    enabled: z.boolean().optional(),
    newLead: z.string().optional(),
    returningLead: z.string().optional(),
  }).optional(),
})

export const configBlockSchemas = {
  aiConfig: aiConfigSchema,
  s3Config: s3ConfigSchema,
  mailConfig: mailConfigSchema,
  embeddingConfig: embeddingConfigSchema,
  langfuseConfig: langfuseConfigSchema,
  triggerConfig: triggerConfigSchema,
  limitsConfig: limitsConfigSchema,
  documentProcessingConfig: documentProcessingConfigSchema,
  crawlerConfig: crawlerConfigSchema,
  pricingConfig: pricingConfigSchema,
  proactiveConfig: proactiveConfigSchema,
  workingHoursConfig: workingHoursConfigSchema,
  dataRetentionConfig: dataRetentionConfigSchema,
  whatsAppConfig: whatsAppConfigSchema,
} as const

export type ConfigBlockKey = keyof typeof configBlockSchemas
