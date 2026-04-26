import { useAgentQualityAlertCount } from '@/features/agent-quality/hooks/use-agent-quality-alert-count'
import { cn } from '@/lib/utils'

export interface AlertCountBadgeProps {
  className?: string
}

export function AlertCountBadge({ className }: AlertCountBadgeProps) {
  const { data } = useAgentQualityAlertCount()
  const count = data?.open ?? 0

  if (count === 0) return null

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${count} açık alarm`}
      className={cn(
        'absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
