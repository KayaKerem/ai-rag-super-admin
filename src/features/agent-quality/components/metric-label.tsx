import { cn } from '@/lib/utils'
import { METRIC_META, type AgentQualityMetric } from '../types'

const TONE_CLASS: Record<'red' | 'amber' | 'orange', string> = {
  red: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  orange:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
}

export interface MetricLabelProps {
  metric: AgentQualityMetric
  className?: string
}

export function MetricLabel({ metric, className }: MetricLabelProps) {
  const meta = METRIC_META[metric]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[meta.tone],
        className
      )}
    >
      {meta.label}
    </span>
  )
}
