export type BudgetBand = 'normal' | 'standard' | 'economy' | 'exhausted' | 'unconfigured'

export interface BudgetStatus {
  band: BudgetBand
  pct: number
  rawPct: number
  label: string
  barColorClass: string
  badgeClass: string
}

const BAND_META: Record<BudgetBand, { label: string; barColorClass: string; badgeClass: string }> = {
  normal: {
    label: 'Normal',
    barColorClass: 'bg-green-500',
    badgeClass: 'bg-green-500/15 text-green-400 border-green-500/30',
  },
  standard: {
    label: "Standard'a Düşürüldü",
    barColorClass: 'bg-yellow-500',
    badgeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
  economy: {
    label: "Economy'ye Düşürüldü",
    barColorClass: 'bg-orange-500',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  exhausted: {
    label: 'Bütçe Tükendi',
    barColorClass: 'bg-red-500',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  unconfigured: {
    label: 'İzleme Yok',
    barColorClass: 'bg-muted',
    badgeClass: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
}

export function computeBudgetBand(spendUsd: number, capUsd: number | null | undefined): BudgetStatus {
  if (capUsd == null || capUsd <= 0) {
    return { band: 'unconfigured', pct: 0, rawPct: 0, ...BAND_META.unconfigured }
  }

  const rawPct = (spendUsd / capUsd) * 100
  const pct = Math.min(100, Math.max(0, rawPct))

  let band: BudgetBand
  if (rawPct < 80) band = 'normal'
  else if (rawPct < 95) band = 'standard'
  else if (rawPct < 97) band = 'economy'
  else band = 'exhausted'

  return { band, pct, rawPct, ...BAND_META[band] }
}
