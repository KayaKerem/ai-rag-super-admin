export type CronCategory = 'platform-lifecycle' | 'billing' | 'connectors' | 'sandbox'

export interface CronEntry {
  category: CronCategory
  route: string
  schedule: string  // cron expression or 'per-source'
  scheduleHuman: string
  description: string
  triggerable: boolean  // false for per-source (Trigger.dev managed)
}

export const CATEGORY_LABELS: Record<CronCategory, string> = {
  'platform-lifecycle': 'Platform Lifecycle',
  billing: 'Billing',
  connectors: 'Connectors',
  sandbox: 'Sandbox',
}

export const CRON_CATALOG: CronEntry[] = [
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/storage-sync',
    schedule: '30 2 * * *',
    scheduleHuman: 'Daily 02:30 UTC',
    description:
      "Tüm tenant'lar için company_storage_usage.last_calculated_at heartbeat. S3 listObjectsV2 entegrasyonu TODO.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/budget-monitor',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 UTC',
    description:
      'Tenant bütçe kullanımını hesaplar; budgetDowngradeThresholdPct (default 80) aşılırsa BUDGET_ALERT log + bildirim.',
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/process-downgrades',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly',
    description:
      "pendingPlanId set olan tenant'lar için yeni billing cycle'a girilince downgrade uygular. PLAN_DOWNGRADE_EXECUTED event + email.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/email-lifecycle',
    schedule: '0 9 * * *',
    scheduleHuman: 'Daily 09:00 UTC',
    description: "Trial ending (3 gün warning) + trial ended (gün 0) lifecycle email'leri.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/subscription-lifecycle',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily 02:00 UTC',
    description:
      'TRIALING → PAST_DUE/ACTIVE self-heal, PAST_DUE → SUSPENDED 7d grace expired sonra.',
    triggerable: true,
  },
  {
    category: 'billing',
    route: '/internal/billing/cleanup-reservations',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly',
    description:
      "RESERVED durumunda kalmış stale budget reservation'ları RELEASED'a çevirir. Default cutoff 1 saat.",
    triggerable: true,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync',
    schedule: 'per-source',
    scheduleHuman: 'Per source (crawlMinIntervalHours)',
    description: 'Tek bir connector source için crawl + ingest. Trigger.dev tarafından çağrılır.',
    triggerable: false,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync-scheduler',
    schedule: '*/30 * * * *',
    scheduleHuman: 'Every 30 min',
    description:
      "Tüm tenant'lar arasında minIntervalHours geçmiş + aktif connector'ları listeleyip Trigger.dev'e fan-out eder.",
    triggerable: true,
  },
  {
    category: 'sandbox',
    route: '/internal/sandbox-quota/reconcile',
    schedule: '0 4 * * *',
    scheduleHuman: 'Daily 04:00 UTC',
    description: 'Counter drift onar — Redis sayılarla DB sayıları arasında mismatch fix.',
    triggerable: true,
  },
  {
    category: 'sandbox',
    route: '/internal/test-sandbox/cleanup',
    schedule: '30 4 * * *',
    scheduleHuman: 'Daily 04:30 UTC',
    description: "Süresi geçmiş sandbox run'larını soft-delete eder (max-age config'e tabi).",
    triggerable: true,
  },
]

export const TRANSLATION_INFO = {
  model: 'anthropic/claude-haiku-4.5',
  temperature: 0,
  timeoutMs: 5000,
  costPerMtokInput: 0.2,
  costPerMtokOutput: 1.0,
  perTurnCostExample: 0.00024,
  monthlyExampleTenant: 0.72,
  rateLimit: { rpmPerCompany: 60, tokensPerHour: 100_000 },
  languages: ['tr', 'en', 'ar', 'fr', 'es', 'de'],
  hydrationStatuses: [
    { value: 'native', label: 'Native', desc: 'Turn zaten istenen dilde' },
    { value: 'cached', label: 'Cached', desc: 'turn_translations cache hit' },
    { value: 'translated', label: 'Translated', desc: 'Bu istek sırasında yeni çeviri üretildi' },
    { value: 'failed', label: 'Failed', desc: 'Hata — translationError dolu' },
  ],
  glossaryLocation: "company_memories.category = 'glossary' (per-tenant)",
  redactionPatterns: ['TC Kimlik', 'Kredi Kartı', 'Telefon', 'SSN', 'URL', 'Email'],
} as const
