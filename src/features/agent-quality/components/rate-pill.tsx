import { cn } from '@/lib/utils'

export interface RatePillProps {
  value: number | null
  className?: string
}

export function RatePill({ value, className }: RatePillProps) {
  if (value == null) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }
  return (
    <span className={cn('tabular-nums', className)}>
      {(value * 100).toFixed(1)}%
    </span>
  )
}
