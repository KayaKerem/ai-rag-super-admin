export type CronCategory =
  | 'platform-lifecycle'
  | 'billing'
  | 'connectors'
  | 'sandbox'
  | 'channel'
  | 'proactive'
  | 'data-retention'

export interface CronEntry {
  category: CronCategory
  route: string
  schedule: string  // cron expression or 'per-source'
  scheduleHuman: string
  description: string
  // true = repo'da Trigger.dev task'i YOK, harici cron (Coolify) tanimlanmali;
  // false = Trigger.dev scheduled task yonetir, Coolify cron gerekmez.
  triggerable: boolean
}

export const CATEGORY_LABELS: Record<CronCategory, string> = {
  'platform-lifecycle': 'Platform Lifecycle',
  billing: 'Billing',
  connectors: 'Connectors',
  sandbox: 'Sandbox',
  channel: 'Channel',
  proactive: 'Proactive',
  'data-retention': 'Data Retention',
}

// Kaynak: docs/frontend-admin/24-platform-cron.md (kod-dogrulamali, 2026-06-12 revizyonu).
// Tum endpoint'ler iki header ister: x-ai-internal-key + X-Edfu-Agent-Id (eksikse 400).
export const CRON_CATALOG: CronEntry[] = [
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/storage-sync',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 UTC (Trigger.dev)',
    description:
      "Tüm tenant'lar için company_storage_usage.last_calculated_at heartbeat (storage.sync.v1). S3 listObjectsV2 entegrasyonu TODO.",
    triggerable: false,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/budget-monitor',
    schedule: '0 9 * * *',
    scheduleHuman: 'Daily 09:00 UTC (Trigger.dev)',
    description:
      'Tenant bütçe kullanımını hesaplar (ai.budget-monitor.v1); budgetDowngradeThresholdPct (default 80) aşılırsa BUDGET_ALERT log + %80/%95/%100 bildirimleri.',
    triggerable: false,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/process-downgrades',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly (harici cron şart)',
    description:
      "Repo'da Trigger task YOK — Coolify'da harici cron tanımlanmalı. pendingPlanId set olan tenant'lar için yeni billing cycle'a girilince downgrade uygular. PLAN_DOWNGRADE_EXECUTED event + email.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/email-lifecycle',
    schedule: '0 9 * * *',
    scheduleHuman: 'Daily 09:00 UTC (harici cron şart)',
    description:
      "Repo'da Trigger task YOK — Coolify'da harici cron tanımlanmalı. Trial ending (3 gün warning) + trial ended (gün 0) lifecycle email'leri.",
    triggerable: true,
  },
  {
    category: 'platform-lifecycle',
    route: '/internal/platform/subscription-lifecycle',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily 02:00 UTC (harici cron şart)',
    description:
      "Repo'da Trigger task YOK — Coolify'da harici cron tanımlanmalı. TRIALING → PAST_DUE/ACTIVE self-heal, PAST_DUE → SUSPENDED 7d grace expired sonra.",
    triggerable: true,
  },
  {
    category: 'billing',
    route: '/internal/billing/cleanup-reservations',
    schedule: '0 */6 * * *',
    scheduleHuman: 'Every 6h (Trigger.dev)',
    description:
      "RESERVED durumunda kalmış stale budget reservation'ları RELEASED'a çevirir (documents.stale-cleanup.v1 üç endpoint'i sırayla çağırır). Cutoff: 10 dakika.",
    triggerable: false,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync',
    schedule: 'per-source',
    scheduleHuman: 'Per source (crawlMinIntervalHours)',
    description: 'Tek bir connector source için crawl + ingest. Scheduler fan-out\'undan per-source tetiklenir (connector.sync.v1).',
    triggerable: false,
  },
  {
    category: 'connectors',
    route: '/internal/connectors/sync-scheduler',
    schedule: '0 * * * *',
    scheduleHuman: 'Hourly (Trigger.dev)',
    description:
      "Tüm tenant'lar arasında minIntervalHours geçmiş + aktif connector'ları listeleyip Trigger.dev'e fan-out eder (connector.sync-scheduler.v1).",
    triggerable: false,
  },
  {
    category: 'sandbox',
    route: '/internal/sandbox-quota/reconcile',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 Europe/Istanbul (Trigger.dev)',
    description: 'Counter drift onar — Redis sayılarla DB sayıları arasında mismatch fix (sandbox-quota.reconcile.v1).',
    triggerable: false,
  },
  {
    category: 'sandbox',
    route: '/internal/test-sandbox/cleanup',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 UTC (Trigger.dev)',
    description: "Süresi geçmiş sandbox run'larını soft-delete eder (playbook.sandbox.cleanup.v1, max-age config'e tabi).",
    triggerable: false,
  },
  {
    category: 'channel',
    route: '/internal/channel/outbound-reaper',
    schedule: '*/10 * * * *',
    scheduleHuman: 'Every 10 min (Trigger.dev)',
    description: "Stuck-PENDING outbound mesajları süpürür (channel.outbound.reaper.v1).",
    triggerable: false,
  },
  {
    category: 'channel',
    route: '/internal/channel/email/poll',
    schedule: '*/5 * * * *',
    scheduleHuman: 'Every 5 min (Trigger.dev fan-out)',
    description: 'Email poll: email.poll-scheduler.v1 aktif kanalları listeler, kanal başına email.poll.v1 tetikler.',
    triggerable: false,
  },
  {
    category: 'channel',
    route: '/internal/agent/memory/extract-eligible',
    schedule: '*/10 * * * *',
    scheduleHuman: 'Every 10 min (Trigger.dev)',
    description: 'Memory auto-extract scheduler (memory.auto-extract.scheduler.v1) — uygun konuşmalardan kullanıcı hafızası çıkarımı.',
    triggerable: false,
  },
  {
    category: 'proactive',
    route: '/internal/proactive/freshness',
    schedule: '0 */6 * * *',
    scheduleHuman: 'Every 6h (Trigger.dev)',
    description: 'Freshness Agent — URL değişiklik kontrolü (proactive.freshness.v1).',
    triggerable: false,
  },
  {
    category: 'proactive',
    route: '/internal/proactive/gap-analysis',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily 02:00 UTC (Trigger.dev)',
    description: 'Gap Agent — bilgi boşluğu analizi (proactive.gap.v1).',
    triggerable: false,
  },
  {
    category: 'proactive',
    route: '/internal/proactive/quality-check',
    schedule: '0 6 * * *',
    scheduleHuman: 'Daily 06:00 UTC (Trigger.dev)',
    description: 'Quality Agent — citation/satisfaction drop izleme (proactive.quality.v1).',
    triggerable: false,
  },
  {
    category: 'data-retention',
    route: '/internal/data-retention/sweep-runtime-events',
    schedule: '0 3 * * *',
    scheduleHuman: 'Daily 03:00 UTC (Trigger.dev)',
    description: 'Süresi geçmiş playbook_runtime_events satırlarını siler (data-retention.sweep-runtime-events.v1).',
    triggerable: false,
  },
  {
    category: 'data-retention',
    route: '/internal/leads/expired',
    schedule: '0 2 * * *',
    scheduleHuman: 'Daily 02:00 UTC (Trigger.dev)',
    description: "dataRetentionConfig.enabled tenant'larda süresi geçmiş lead'leri hard-delete eder (lead.data-retention-cleanup.v1, batch 100).",
    triggerable: false,
  },
]

// Kaynak: docs/frontend-admin/25-translation.md (kod-dogrulamali, 2026-06-12 revizyonu).
export const TRANSLATION_INFO = {
  model: 'deepseek/deepseek-v4-flash',
  temperature: 0,
  timeoutMs: 8000,
  retry: '1× retry (300ms backoff, batch path)',
  maxInputChars: 8000,
  maxTokens: 2048,
  costPerMtokInput: 0.1,
  costPerMtokOutput: 0.2,
  perTurnCostExample: 0.00006,
  monthlyExampleTenant: 0.18,
  rateLimit: { rpmPerCompany: 60, tokensPerHour: 100_000 },
  languages: ['tr', 'en', 'ar', 'fr', 'es', 'de'],
  hydrationStatuses: [
    { value: 'hydrated', label: 'Hydrated', desc: 'Çeviri mevcut — cache hit veya bu istekte üretildi (ayrım bu alanda yok)' },
    { value: 'already_target', label: 'Already Target', desc: 'Turn zaten istenen dilde — çeviri gereksiz (skip)' },
    { value: 'error', label: 'Error', desc: 'Hata — translationError dolu (rate_limited | unavailable)' },
    { value: 'not_hydrated', label: 'Not Hydrated', desc: "HYDRATE_CAP=50 penceresi dışında — FE scroll'da lazy-load eder" },
  ],
  glossaryLocation: "company_memories.category = 'glossary' (per-tenant — çeviri prompt'una henüz bağlı değil, backlog)",
  redactionMasks: [
    { pattern: 'TC Kimlik (checksum-valid)', mask: '[TCK]' },
    { pattern: 'Kredi kartı (Luhn + BIN)', mask: '**** **** **** <son4>' },
    { pattern: 'Telefon (E.164 / 0xxx / 10 hane)', mask: '+90 *** *** ** <son2>' },
    { pattern: 'SSN (XXX-XX-XXXX)', mask: '***-**-<son4>' },
  ],
  notRedacted: ['URL', 'Email'],
} as const
