import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AtRiskBandBadgeProps {
  band: 'exhausted' | 'economy'
}

export function AtRiskBandBadge({ band }: AtRiskBandBadgeProps) {
  if (band === 'exhausted') {
    return (
      <Badge
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        aria-label="Exhausted: bütçe %97 üzeri"
      >
        <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
        Exhausted
      </Badge>
    )
  }
  return (
    <Badge
      className="bg-orange-500 text-white hover:bg-orange-500/90"
      aria-label="Economy: bütçe %95-97 arası"
    >
      <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
      Economy
    </Badge>
  )
}
