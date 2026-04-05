// Treasury mock data for Avalanche C-Chain USDC treasury module
import { mockCompanies } from './data'

// ─── Dashboard ─────────────────────────────────────────
export let mockTreasuryDashboard: any = {
  last_snapshot_at: '2026-04-05T12:00:00Z',
  openrouter: {
    balance: 74.75,
    total_credits: 100.5,
    total_usage: 25.75,
    runway_days: 20,
  },
  avalanche: {
    liquid_usdc: 1000.0,
    staked_aave: 500.0,
    staked_benqi: 300.0,
    avax_balance: 2.5,
  },
  totals: {
    total_treasury: 1874.75,
    effective_liquid: 1074.75,
    total_staked: 800.0,
  },
  metrics: {
    daily_burn_rate: 5.0,
    projected_runway_days: 214,
    active_customers: 10,
    total_monthly_budget: 150.0,
  },
  openrouter_topup: {
    recommended_amount: 150.0,
    estimated_topup_date: '2026-04-24',
  },
  pending_actions_count: 2,
  unacknowledged_alerts_count: 3,
}

// ─── Snapshots (30 days) ───────────────────────────────
function generateSnapshots(days: number) {
  const snapshots: any[] = []
  let liquidUsdc = 1000.0
  let stakedAave = 500.0
  let stakedBenqi = 300.0
  let orBalance = 74.75
  let avaxBalance = 2.5

  for (let i = 0; i < days; i++) {
    const date = new Date('2026-04-05T12:00:00Z')
    date.setDate(date.getDate() - i)

    snapshots.push({
      id: `snap-${i + 1}`,
      date: date.toISOString().split('T')[0],
      snapshotAt: date.toISOString(),
      liquidUsdc: +liquidUsdc.toFixed(2),
      stakedAave: +stakedAave.toFixed(2),
      stakedBenqi: +stakedBenqi.toFixed(2),
      totalTreasury: +(liquidUsdc + stakedAave + stakedBenqi + orBalance).toFixed(2),
      orBalance: +orBalance.toFixed(2),
      avaxBalance: +avaxBalance.toFixed(4),
      dailyBurnRate: +(4.5 + Math.random() * 1.0).toFixed(2),
    })

    // Go back one day: slight fluctuations
    liquidUsdc += (Math.random() - 0.45) * 30 // slight upward drift going backward
    stakedAave += (Math.random() - 0.5) * 8
    stakedBenqi += (Math.random() - 0.5) * 5
    orBalance += 2.5 + (Math.random() - 0.5) * 0.5 // balance was higher in the past
    avaxBalance += (Math.random() - 0.5) * 0.1
    if (avaxBalance < 0.5) avaxBalance = 0.5
  }

  return snapshots
}

export let mockTreasurySnapshots: any[] = generateSnapshots(30)

// ─── Customer Usage ────────────────────────────────────
const planBudgets: Record<string, number> = {
  'plan-starter': 10,
  'plan-pro': 25,
  'plan-enterprise': 50,
}

export let mockTreasuryCustomers: any[] = mockCompanies
  .filter((c) => c.subscriptionStatus === 'active' || c.subscriptionStatus === 'trialing')
  .map((c) => {
    const budget = planBudgets[c.planId as string] ?? 10
    const usagePct = 0.4 + Math.random() * 0.55 // 40-95%
    const currentSpend = +(budget * usagePct).toFixed(2)
    return {
      companyId: c.id,
      companyName: c.name,
      planId: c.planId,
      planName: c.plan?.name ?? 'N/A',
      budgetUsd: budget,
      currentSpendUsd: currentSpend,
      usagePct: +(usagePct * 100).toFixed(1),
      lastActivityAt: new Date(
        Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)
      ).toISOString(),
    }
  })

// ─── Transactions ──────────────────────────────────────
const txTypes = [
  'deposit_aave',
  'withdraw_aave',
  'deposit_benqi',
  'withdraw_benqi',
  'wallet_inflow',
  'wallet_outflow',
  'openrouter_topup_detected',
] as const

function protocolForType(
  type: string
): 'aave_v3' | 'benqi' | null {
  if (type.includes('aave')) return 'aave_v3'
  if (type.includes('benqi')) return 'benqi'
  return null
}

function randomHex(length: number): string {
  let result = ''
  const chars = '0123456789abcdef'
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function generateUuid(): string {
  return [
    randomHex(8),
    randomHex(4),
    '4' + randomHex(3),
    (8 + Math.floor(Math.random() * 4)).toString(16) + randomHex(3),
    randomHex(12),
  ].join('-')
}

function generateTransactions(count: number) {
  const transactions: any[] = []
  const triggeredByOptions = ['system', 'admin_approved', 'auto']

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date('2026-04-05T12:00:00Z')
    date.setDate(date.getDate() - daysAgo)
    date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

    const type = txTypes[i % txTypes.length]
    const amount = +(50 + Math.random() * 450).toFixed(2)
    const hasAction = Math.random() > 0.5

    transactions.push({
      id: generateUuid(),
      createdAt: date.toISOString(),
      type,
      amountUsdc: amount,
      protocol: protocolForType(type),
      txHash: '0x' + randomHex(64),
      triggeredBy: triggeredByOptions[Math.floor(Math.random() * triggeredByOptions.length)],
      actionId: hasAction ? generateUuid() : null,
    })
  }

  // Sort newest first
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return transactions
}

export let mockTreasuryTransactions: any[] = generateTransactions(42)

// ─── Alerts ────────────────────────────────────────────
export let mockTreasuryAlerts: any[] = [
  {
    id: 'alert-1',
    createdAt: '2026-04-05T08:00:00Z',
    severity: 'critical',
    category: 'gas',
    message: 'AVAX gas bakiyesi kritik',
    detail: 'AVAX bakiyesi 0.15 seviyesine düştü. Minimum 0.5 AVAX öneriliyor.',
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'alert-2',
    createdAt: '2026-04-04T14:00:00Z',
    severity: 'critical',
    category: 'openrouter',
    message: 'OpenRouter bakiye düşük',
    detail: 'OpenRouter bakiyesi $74.75 — tahmini 20 gün kaldı. Topup önerilir.',
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'alert-3',
    createdAt: '2026-04-04T10:00:00Z',
    severity: 'warning',
    category: 'rebalance',
    message: 'Rebalance önerisi mevcut',
    detail: 'Aave/Benqi oranı hedef dışında (%70/%30 vs hedef %62.5/%37.5). Rebalance önerilir.',
    acknowledgedAt: null,
    acknowledgedBy: null,
  },
  {
    id: 'alert-4',
    createdAt: '2026-04-03T16:00:00Z',
    severity: 'warning',
    category: 'balance',
    message: 'Müşteri bütçe aşımı',
    detail: 'Firma Alpha müşterisi bütçesinin %92 kullanmış. Ay sonu yaklaşıyor.',
    acknowledgedAt: '2026-04-03T17:30:00Z',
    acknowledgedBy: 'admin-1',
  },
  {
    id: 'alert-5',
    createdAt: '2026-04-03T09:00:00Z',
    severity: 'info',
    category: 'daily_summary',
    message: 'Günlük özet',
    detail: 'Günlük yanma: $5.12, Treasury: $1,874.75, Runway: 214 gün.',
    acknowledgedAt: '2026-04-03T10:00:00Z',
    acknowledgedBy: 'admin-1',
  },
  {
    id: 'alert-6',
    createdAt: '2026-04-02T11:00:00Z',
    severity: 'info',
    category: 'config_change',
    message: 'Config değişikliği',
    detail: 'bufferDays 60 → 90 olarak güncellendi.',
    acknowledgedAt: '2026-04-02T12:00:00Z',
    acknowledgedBy: 'admin-1',
  },
]

// ─── Actions ───────────────────────────────────────────
export let mockTreasuryActions: any[] = [
  // 2 pending
  {
    id: 'act-1',
    createdAt: '2026-04-05T10:00:00Z',
    type: 'stake_aave',
    amountUsdc: 200.0,
    reason: 'Excess liquid USDC detected — staking to Aave for yield.',
    metadata: { targetApy: 4.2, currentLiquid: 1000.0 },
    status: 'pending',
    expiresAt: '2026-04-06T10:00:00Z',
    approvedAt: null,
    approvedBy: null,
    executedAt: null,
    txHash: null,
    errorMessage: null,
  },
  {
    id: 'act-2',
    createdAt: '2026-04-05T09:30:00Z',
    type: 'unstake_benqi',
    amountUsdc: 100.0,
    reason: 'Projected liquidity shortfall in 14 days — unstaking from Benqi.',
    metadata: { projectedDeficitDays: 14, currentStakedBenqi: 300.0 },
    status: 'pending',
    expiresAt: '2026-04-06T09:30:00Z',
    approvedAt: null,
    approvedBy: null,
    executedAt: null,
    txHash: null,
    errorMessage: null,
  },
  // 2 executed
  {
    id: 'act-3',
    createdAt: '2026-04-03T08:00:00Z',
    type: 'stake_aave',
    amountUsdc: 150.0,
    reason: 'Buffer exceeded threshold — staking to Aave.',
    metadata: { targetApy: 4.1 },
    status: 'executed',
    expiresAt: '2026-04-04T08:00:00Z',
    approvedAt: '2026-04-03T09:00:00Z',
    approvedBy: 'admin-1',
    executedAt: '2026-04-03T09:01:00Z',
    txHash: '0x' + randomHex(64),
    errorMessage: null,
  },
  {
    id: 'act-4',
    createdAt: '2026-04-02T07:00:00Z',
    type: 'deposit_benqi',
    amountUsdc: 100.0,
    reason: 'Rebalancing allocation toward Benqi to match target ratio.',
    metadata: { currentRatio: 0.7, targetRatio: 0.375 },
    status: 'executed',
    expiresAt: '2026-04-03T07:00:00Z',
    approvedAt: '2026-04-02T08:00:00Z',
    approvedBy: 'admin-1',
    executedAt: '2026-04-02T08:02:00Z',
    txHash: '0x' + randomHex(64),
    errorMessage: null,
  },
  // 1 rejected
  {
    id: 'act-5',
    createdAt: '2026-04-01T12:00:00Z',
    type: 'unstake_benqi',
    amountUsdc: 250.0,
    reason: 'Large unstake recommended due to potential market conditions.',
    metadata: { riskScore: 'medium' },
    status: 'rejected',
    expiresAt: '2026-04-02T12:00:00Z',
    approvedAt: null,
    approvedBy: null,
    executedAt: null,
    txHash: null,
    rejectedAt: '2026-04-01T14:00:00Z',
    errorMessage: null,
  },
  // 1 failed
  {
    id: 'act-6',
    createdAt: '2026-03-31T10:00:00Z',
    type: 'stake_aave',
    amountUsdc: 300.0,
    reason: 'Automated staking attempt for idle USDC.',
    metadata: { retryCount: 2 },
    status: 'failed',
    expiresAt: '2026-04-01T10:00:00Z',
    approvedAt: '2026-03-31T11:00:00Z',
    approvedBy: 'admin-1',
    executedAt: null,
    txHash: null,
    errorMessage: 'Transaction reverted: insufficient gas (AVAX balance too low)',
  },
]

// ─── Config ────────────────────────────────────────────
export let mockTreasuryConfig: any = {
  id: 'tc-1',
  bufferDays: 90,
  stakeThreshold: 1.5,
  unstakeThreshold: 0.5,
  aaveRatio: 0.625,
  benqiRatio: 0.375,
  orWarningDays: 14,
  orCriticalDays: 7,
  minStakeUsdc: 50.0,
  minUnstakeUsdc: 50.0,
  maxActionPct: 0.5,
  deficitConsecutiveChecks: 2,
  updatedAt: '2026-04-04T10:00:00Z',
  updatedBy: 'admin-1',
}

// ─── OpenRouter Details ────────────────────────────────
function generateOrTrend(days: number) {
  const trend: any[] = []
  let balance = 74.75

  for (let i = 0; i < days; i++) {
    const date = new Date('2026-04-05T00:00:00Z')
    date.setDate(date.getDate() - i)

    trend.push({
      date: date.toISOString().split('T')[0],
      balance: +balance.toFixed(2),
    })

    // Going backward, balance was higher
    balance += 2.5 + (Math.random() - 0.5) * 0.8
  }

  return trend
}

export let mockOpenRouterDetails: any = {
  balance: 74.75,
  runwayDays: 20,
  recommendedTopup: 150.0,
  dailyBurnRate: 5.0,
  trend: generateOrTrend(30),
}
