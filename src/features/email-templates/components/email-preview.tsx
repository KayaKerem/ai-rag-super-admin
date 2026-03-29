import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { usePreviewEmailTemplate } from '../hooks/use-email-templates'

const sampleVariables: Record<string, string> = {
  userName: 'Ali Veli',
  companyName: 'Acme Inc',
  adminName: 'Mehmet Yılmaz',
  loginUrl: 'https://app.example.com/login',
  trialEndDate: '15 Nisan 2026',
  planName: 'Pro',
  upgradeUrl: 'https://app.example.com/upgrade',
  daysRemaining: '7',
  oldPlanName: 'Starter',
  newPlanName: 'Pro',
  currentPlanName: 'Pro',
  effectiveDate: '14 Nisan 2026',
  prorateTry: '124.58',
  changedFeatures: 'AI bütçesi: 25→10 USD, Depolama: 20→5 GB',
  usagePercent: '80',
  resetDate: '1 Nisan 2026',
  inviterName: 'Ayşe Demir',
  role: 'admin',
  acceptUrl: 'https://app.example.com/invite/abc123',
  expiresIn: '7 gün',
  resetUrl: 'https://app.example.com/reset/abc123',
  verificationUrl: 'https://app.example.com/verify/abc123',
  amount: '2.990,00 ₺',
  currency: 'TRY',
  invoiceUrl: 'https://app.example.com/invoice/123',
  retryUrl: 'https://app.example.com/billing',
  nextAttemptDate: '3 Nisan 2026',
  invoiceNumber: 'INV-2026-0042',
  downloadUrl: 'https://app.example.com/invoice/123/download',
  newUserName: 'Yeni Kullanıcı',
  newUserEmail: 'yeni@firma.com',
  newUserRole: 'member',
}

interface EmailPreviewProps {
  slug: string
  availableVariables: string[]
}

export function EmailPreview({ slug, availableVariables }: EmailPreviewProps) {
  const preview = usePreviewEmailTemplate(slug)

  function handlePreview() {
    const vars: Record<string, string> = {}
    for (const v of availableVariables) {
      vars[v] = sampleVariables[v] ?? v
    }
    preview.mutate(vars)
  }

  return (
    <div className="space-y-3">
      <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={preview.isPending}>
        <Eye className="mr-1 h-4 w-4" />
        {preview.isPending ? 'Yükleniyor...' : 'Önizle'}
      </Button>

      {preview.data && (
        <div className="space-y-2 rounded-lg border p-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Konu: </span>
            <span className="text-sm">{preview.data.subject}</span>
          </div>
          <iframe
            sandbox=""
            srcDoc={preview.data.html}
            className="w-full rounded border bg-white"
            style={{ minHeight: 200 }}
            title="Email önizleme"
          />
        </div>
      )}
    </div>
  )
}
