export interface CompanyPlanSummary {
  id: string
  name: string
  slug: string
  monthlyPriceTry: number | null
  includedUsers: number
  isActive: boolean
}

export type SubscriptionStatus = 'trialing' | 'active' | 'suspended' | 'cancelled' | 'past_due'

export type CustomerAgentTrustLevel = 'FULL_CONTROL' | 'AUTO_MESSAGE' | 'AUTO_ALL_QUOTE_APPROVAL' | 'FULLY_AUTOMATIC'
export type ApprovalTimeoutAction = 'REMIND' | 'AUTO_SEND' | 'HOLD'

export interface Company {
  id: string
  name: string
  logoUrl: string | null
  planId: string | null
  plan: CompanyPlanSummary | null
  pendingPlanId: string | null
  pendingPlan: CompanyPlanSummary | null
  downgradeScheduledAt: string | null
  subscriptionStatus: SubscriptionStatus
  statusChangedAt: string | null
  customerAgentTrustLevel: CustomerAgentTrustLevel
  autoApproveQuoteThreshold: number | null
  approvalTimeoutMinutes: number
  approvalTimeoutAction: ApprovalTimeoutAction
  customerOperationsBudgetUsd: number | null
  createdAt: string
  updatedAt: string
}

export interface CompanyUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  companyId: string
  isActive: boolean
  isPlatformAdmin: boolean
  createdAt: string
}

export interface UsageMonth {
  month: string
  ai: { totalTokens: number; turnCount: number; costUsd: number }
  rerank?: { searchCount: number; documentCount: number; costUsd: number }
  webSearch?: { searchCount: number; resultCount: number; costUsd: number }
  proactive?: { runCount: number; insightCount: number; costUsd: number }
  cacheHits?: { hitCount: number; hitRate: number; estimatedSavingsUsd: number }
  research?: { callCount: number; costUsd: number }
  quotePrepare?: { callCount: number; costUsd: number }
  storage: { currentBytes: number; costUsd: number }
  trigger: { taskCount: number; costUsd: number }
  totalCostUsd: number
}

export interface CompanyUsage {
  companyId: string
  companyName: string
  months: UsageMonth[]
}

export interface PlatformModel {
  id: string
  label: string
  tier: 'premium' | 'standard' | 'economy' | 'free'
  pricing: { inputPerMtok: number; outputPerMtok: number }
}

export interface AllowedModel {
  id: string
  label?: string
  tier?: 'premium' | 'standard' | 'economy' | 'free'
  isDefault?: boolean
}

// ─── Tool Governance ────────────────────────────────

export interface RegisteredTool {
  id: string
  label: string
  description: string
  category: string
  requiresApproval: boolean
}

export interface ToolPlan {
  label: string
  description: string
  tools: string[]
}

export interface ToolPlansResponse {
  defaultPlan: string
  plans: Record<string, ToolPlan>
  registeredTools: RegisteredTool[]
}

export interface ResolvedTool {
  id: string
  label: string
  category: string
  requiresApproval: boolean
  enabled: boolean
  source: 'plan' | 'override' | 'not_in_plan'
}

export interface CompanyToolConfig {
  plan: string
  overrides: Record<string, boolean>
  resolvedTools: ResolvedTool[]
}

// ─── Analytics ─────────────────────────────────────

export interface AnalyticsMonth {
  month: string
  conversations: { total: number; activeUsers: number }
  turns: { total: number; avgPerConversation: number }
  feedback: {
    totalRatings: number
    positiveCount: number
    negativeCount: number
    satisfactionRate: number
    topReasons: Array<{ code: string; count: number }>
  }
  quality: {
    avgGroundedness: number
    avgRelevance: number
    lowQualityCount: number
    evaluatedCount: number
  }
  tools: {
    totalCalls: number
    byTool: Array<{ name: string; count: number }>
  }
  search: { noResultCount: number; noResultRate: number }
}

export interface CompanyAnalytics {
  companyId: string
  companyName: string
  months: AnalyticsMonth[]
}

// ─── Data Sources / Connectors ──────────────────────

export interface DataSourceType {
  type: string
  label: string
  description: string
}

export interface DataSource {
  id: string
  companyId: string
  companyName: string
  type: string
  name: string
  config: Record<string, unknown>
  status: 'active' | 'syncing' | 'paused' | 'error'
  errorMessage: string | null
  itemCount: number
  lastSyncAt: string | null
  nextSyncAt: string | null
  createdAt: string
}

export interface DataSourceList {
  items: DataSource[]
  total: number
}

// ─── Agent Metrics ────────────────────────────────

export interface AgentMetrics {
  windowDays: number
  conversations: { total: number; assistantTurnsTotal: number }
  citationCoverage: {
    outputsAnalyzed: number
    outputsWithAnyCitation: number
    outputsWithDocumentCitation: number
    outputsWithKnowledgeCitation: number
    rate: number
    warningReasonCounts: Record<string, number>
    blockingReasonCounts: Record<string, number>
  }
  humanWorkflow: {
    pendingActions: number
    approvedActions: number
    rejectedActions: number
    approvalRate: number
  }
  feedback: {
    total: number
    positive: number
    negative: number
    qualityScore: number
  }
  alerts: AgentAlert[]
}

export interface AgentAlert {
  code: string
  severity: 'warning' | 'critical'
  message: string
  value: number
}

// ─── Pricing Plans ────────────────────────────────

export interface PricingPlan {
  id: string
  name: string
  slug: string
  description: string | null
  monthlyPriceTry: number | null
  includedUsers: number
  extraUserPriceTry: number | null
  budgetUsd: number
  budgetDowngradeThresholdPct: number
  maxStorageGb: number
  maxFileSizeMb: number
  allowedModels: Array<{ id: string; label: string }>
  allowedTools: string[]
  allowedConnectors: string[]
  crawlMaxPages: number
  crawlMaxSources: number
  isActive: boolean
  sortOrder: number
  companyCount: number
  createdAt: string
  updatedAt: string
}

export interface CreatePlanRequest {
  name: string
  slug: string
  description?: string
  monthlyPriceTry?: number | null
  includedUsers?: number
  extraUserPriceTry?: number | null
  budgetUsd?: number
  budgetDowngradeThresholdPct?: number
  maxStorageGb?: number
  maxFileSizeMb?: number
  allowedModels?: Array<{ id: string; label: string }>
  allowedTools?: string[]
  allowedConnectors?: string[]
  crawlMaxPages?: number
  crawlMaxSources?: number
  isActive?: boolean
  sortOrder?: number
}

export interface AssignPlanResponse {
  companyId: string
  planId: string | null
  planName: string | null
  pendingPlanId?: string | null
  pendingPlanName?: string | null
  action: 'upgraded' | 'downgrade_scheduled' | 'no_change' | 'removed'
  effective?: 'immediate' | 'next_cycle'
  effectiveDate?: string
  prorate?: { prorateTry: number | null }
}

export interface DeletePlanResponse {
  deactivated: boolean
  affectedCompanies: number
  warning?: string
}

export interface CancelDowngradeResponse {
  companyId: string
  pendingPlanId: null
  action: 'downgrade_cancelled'
}

// ─── Email Templates ──────────────────────────────

export interface EmailTemplate {
  id: string
  slug: string
  name: string
  subject: string
  bodyHtml: string
  availableVariables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateEmailTemplateRequest {
  subject?: string
  bodyHtml?: string
  isActive?: boolean
}

export interface EmailPreviewRequest {
  variables: Record<string, string>
}

export interface EmailPreviewResponse {
  subject: string
  html: string
}

// ─── Subscription & Billing ───────────────────────

export interface UpdateCompanyStatusRequest {
  status: 'active' | 'suspended' | 'cancelled'
}

export interface UpdateCompanyStatusResponse {
  id: string
  subscriptionStatus: SubscriptionStatus
  statusChangedAt: string
}

export interface BillingEvent {
  id: string
  companyId: string
  eventType: 'status_change' | 'plan_upgrade' | 'plan_downgrade_scheduled' | 'plan_downgrade_executed' | 'plan_removed' | 'plan_downgrade_cancelled' | 'admin_override'
  metadata: Record<string, string>
  actorId: string
  createdAt: string
}

// ─── Leads ──────────────────────────────────────

export interface Lead {
  id: string
  companyId: string
  name: string
  email: string | null
  phone: string | null
  status: string
  source: string | null
  lastContactAt: string | null
  createdAt: string
}

export interface PermanentDeleteResponse {
  taskId: string
  status: 'processing'
}

// ─── Service Accounts ───────────────────────────

export type AuthMethod = 'email_password' | 'google' | 'github' | 'sso' | 'api_key_only'

export interface ServiceAccount {
  id: string
  serviceName: string
  url: string | null
  email: string | null
  encryptedPassword: string
  decryptedPassword?: string
  authMethod: AuthMethod | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateServiceAccountRequest {
  serviceName: string
  url?: string
  email?: string
  password?: string
  authMethod?: AuthMethod
  notes?: string
}

export interface UpdateServiceAccountRequest {
  serviceName?: string
  url?: string | null
  email?: string | null
  password?: string | null
  authMethod?: AuthMethod
  notes?: string | null
}

// ─── Activity Log ────────────────────────────────

export type ActivityCategory = 'auth' | 'user' | 'document' | 'folder' | 'knowledge' | 'conversation' | 'company' | 'connector' | 'note' | 'lead' | 'playbook' | 'quote' | 'channel'

export interface ActivityLogItem {
  id: string
  companyId: string
  userId: string | null
  action: string
  category: ActivityCategory
  resourceId: string | null
  resourceType: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  sequenceNumber: number
  contentHash: string | null
  previousHash: string | null
}

export interface ActivityLogResponse {
  items: ActivityLogItem[]
  total: number
}

// ─── Revenue ──────────────────────────────────────

export interface RevenueByPlan {
  planId: string
  planName: string
  planSlug: string
  companyCount: number
  userCount: number
  planMrrTry: number
  extraUserMrrTry: number
  totalMrrTry: number
}

export interface RevenueData {
  mrrTry: number
  mrrUsd: number
  exchangeRate: number
  exchangeRateSource: 'tcmb' | 'fallback'
  totalActiveCompanies: number
  totalCompanies: number
  totalActiveUsers: number
  byPlan: RevenueByPlan[]
  totalAiCostUsd: number
  marginTry: number
}

// ─── Search Analytics ────────────────────────────

export interface SearchAnalytics {
  windowDays: number
  totalQueries: number
  emptyQueries: number
  emptyRate: number
  avgResultCount: number
  avgResponseTimeMs: number
  topQueries: Array<{ queryText: string; count: number; emptyRate: number }>
  unansweredQueries: Array<{ queryText: string; count: number; lastAsked: string }>
  byTool: Record<string, { total: number; empty: number; avgResponseTimeMs: number }>
  feedbackCorrelation: {
    queriesWithNegativeFeedback: number
    topNegativeQueries: Array<{ queryText: string; negativeCount: number; totalCount: number }>
  }
  dailyTrend: Array<{ date: string; total: number; empty: number }>
}

// ─── Proactive Insights ─────────────────────────────

export type ProactiveAgentType = 'freshness' | 'gap' | 'quality'
export type ProactiveInsightStatus = 'new' | 'acknowledged' | 'resolved' | 'dismissed'
export type ProactiveCategory = 'content_changed' | 'url_unreachable' | 'unanswered_topic' | 'citation_drop' | 'satisfaction_drop'

export interface ProactiveInsight {
  id: string
  agentType: ProactiveAgentType
  category: ProactiveCategory
  status: ProactiveInsightStatus
  title: string
  description: string
  metadata: Record<string, unknown> | null
  actionTaken: string | null
  costUsd: number
  createdAt: string
  updatedAt: string
}

export interface ProactiveInsightSummary {
  new: number
  acknowledged: number
  resolved: number
  dismissed: number
  total: number
}

// ─── Company Memories ──────────────────────────────

export type MemoryType = 'fact' | 'preference' | 'glossary'
export type VisibilityScope = 'INTERNAL_ONLY' | 'CUSTOMER_SAFE'

export interface CompanyMemory {
  id: string
  companyId: string
  memoryType: MemoryType
  content: string
  source: string | null
  createdByUserId: string | null
  accessCount: number
  lastAccessedAt: string | null
  visibilityScope: VisibilityScope | null
  category: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
