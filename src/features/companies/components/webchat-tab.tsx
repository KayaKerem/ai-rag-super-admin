import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import type { Company } from '../types'
import { WebChatConfigCard } from './webchat-config-card'

interface WebChatTabProps {
  company: Company
}

export function WebChatTab({ company }: WebChatTabProps) {
  return (
    <div className="space-y-4">
      {/* Slug readonly */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Slug</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-sm bg-muted px-2 py-1 rounded">{company.slug}</code>
          <p className="text-xs text-muted-foreground mt-2">
            Slug &quot;Şirket Bilgi&quot; sekmesinden değiştirilebilir.
          </p>
        </CardContent>
      </Card>

      {/* Brand + Logo card */}
      <WebChatConfigCard company={company} />

      {/* WP plugin section placeholder (filled in Task 5) */}
      <div data-placeholder="wp-plugin-section">{/* Task 5 */}</div>

      {/* Universal embed section placeholder (filled in Task 6) */}
      <div data-placeholder="universal-embed-section">{/* Task 6 */}</div>

      {/* B17 cross-link banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
        <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Visitor verify-fail dashboard Sprint B follow-up</p>
          <p className="text-xs text-muted-foreground">
            Backend mirror endpoint (<code>/platform/companies/:id/visitor-session-stats</code>) henüz yok — Sprint B17.
          </p>
        </div>
      </div>
    </div>
  )
}
