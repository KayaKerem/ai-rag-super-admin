import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface CategoryBreakdownProps {
  ai: number
  cdn: number
  storage: number
  trigger: number
}

const categories = [
  { key: 'ai' as const, label: 'AI', color: '#6d28d9' },
  { key: 'cdn' as const, label: 'CDN', color: '#3b82f6' },
  { key: 'storage' as const, label: 'Storage', color: '#22c55e' },
  { key: 'trigger' as const, label: 'Trigger', color: '#f59e0b' },
]

export function CategoryBreakdown({ ai, cdn, storage, trigger }: CategoryBreakdownProps) {
  const values = { ai, cdn, storage, trigger }
  const max = Math.max(ai, cdn, storage, trigger, 0.01)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Kategori Dağılımı</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{cat.label}</span>
              <span className="font-semibold">{formatCurrency(values[cat.key])}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((values[cat.key] / max) * 100, 1)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
