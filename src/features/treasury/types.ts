// ─── Treasury Dashboard ──────────────────────────

export interface TreasuryDashboard {
  last_snapshot_at: string
  openrouter: {
    balance: number
    total_credits: number
    total_usage: number
    runway_days: number
  }
  avalanche: {
    liquid_usdc: number
    staked_aave: number
    staked_benqi: number
    avax_balance: number
  }
  totals: {
    total_treasury: number
    effective_liquid: number
    total_staked: number
  }
  metrics: {
    daily_burn_rate: number
    projected_runway_days: number
    active_customers: number
    total_monthly_budget: number
  }
  openrouter_topup: {
    recommended_amount: number
    estimated_topup_date: string
  }
  pending_actions_count: number
  unacknowledged_alerts_count: number
}

// ─── Treasury Snapshots ──────────────────────────

export interface TreasurySnapshot {
  id: string
  createdAt: string
  openrouterBalance: number
  avalancheLiquidUsdc: number
  avalancheStakedAave: number
  avalancheStakedBenqi: number
  avalancheAvaxBalance: number
  totalTreasuryValue: number
  dailyBurnRate: number
  projectedRunwayDays: number
  activeCustomerCount: number
  totalMonthlyBudget: number
}

// ─── Treasury Customers ──────────────────────────

export interface TreasuryCustomerUsage {
  companyId: string
  planName: string
  monthlyBudget: number
  currentSpend: number
  usagePct: number
  updatedAt: string
}

// ─── Treasury Transactions ───────────────────────

export type TransactionType =
  | 'deposit_aave'
  | 'withdraw_aave'
  | 'deposit_benqi'
  | 'withdraw_benqi'
  | 'wallet_inflow'
  | 'wallet_outflow'
  | 'openrouter_topup_detected'

export interface TreasuryTransaction {
  id: string
  createdAt: string
  type: TransactionType
  amountUsdc: number
  protocol: string | null
  txHash: string | null
  triggeredBy: string
  actionId: string | null
}

export interface PaginatedTransactions {
  items: TreasuryTransaction[]
  total: number
  page: number
  limit: number
}

// ─── Treasury Alerts ─────────────────────────────

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertCategory =
  | 'balance'
  | 'openrouter'
  | 'rebalance'
  | 'gas'
  | 'action_failed'
  | 'daily_summary'
  | 'config_change'

export interface TreasuryAlert {
  id: string
  createdAt: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  data: Record<string, unknown> | null
  acknowledgedAt: string | null
  acknowledgedBy: string | null
}

// ─── Treasury Actions ────────────────────────────

export type ActionType =
  | 'stake_aave'
  | 'unstake_aave'
  | 'stake_benqi'
  | 'unstake_benqi'

export type ActionStatus =
  | 'pending'
  | 'approved'
  | 'executed'
  | 'rejected'
  | 'failed'
  | 'expired'

export interface TreasuryAction {
  id: string
  createdAt: string
  type: ActionType
  amountUsdc: number
  reason: string
  metadata: Record<string, unknown> | null
  status: ActionStatus
  expiresAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  executedAt: string | null
  txHash: string | null
  errorMessage: string | null
}

// ─── Treasury Config ─────────────────────────────

export interface TreasuryConfig {
  id: string
  bufferDays: number
  stakeThreshold: number
  unstakeThreshold: number
  aaveRatio: number
  benqiRatio: number
  orWarningDays: number
  orCriticalDays: number
  minStakeUsdc: number
  minUnstakeUsdc: number
  maxActionPct: number
  deficitConsecutiveChecks: number
  updatedAt: string
  updatedBy: string
}

// ─── OpenRouter Details ──────────────────────────

export interface OpenRouterDetails {
  balance: number
  runwayDays: number
  recommendedTopup: number
  dailyBurnRate: number
  trend: Array<{ date: string; balance: number }>
}
