import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { CronEntry } from '../data/catalog'

interface CronCardProps {
  entry: CronEntry
}

function buildSnippet(entry: CronEntry): string {
  const apiBase = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
  const name = entry.route.split('/').filter(Boolean).pop() ?? 'cron'
  return `- name: ${name}
  schedule: "${entry.schedule}"
  command: |
    curl -X POST ${apiBase}${entry.route} \\
      -H "x-ai-internal-key: $AI_INTERNAL_SECRET"`
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Kopyalandı')
  } catch {
    toast.error('Kopyalama başarısız — manuel seç')
  }
}

export function CronCard({ entry }: CronCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <code className="text-xs font-mono">{entry.route}</code>
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {entry.scheduleHuman}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{entry.description}</p>
        {entry.triggerable ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(buildSnippet(entry))}
            className="w-full"
          >
            <Copy className="h-3 w-3 mr-2" />
            Coolify YAML kopyala
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Trigger.dev managed — Coolify cron yok
          </div>
        )}
      </CardContent>
    </Card>
  )
}
