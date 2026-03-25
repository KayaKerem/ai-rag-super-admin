import { Card, CardContent } from '@/components/ui/card'

interface KpiCardProps {
  label: string
  value: string
  subtitle?: string
  subtitleColor?: string
}

export function KpiCard({ label, value, subtitle, subtitleColor }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className={`mt-1 text-xs ${subtitleColor ?? 'text-muted-foreground'}`}>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
