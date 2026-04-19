import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateCompany } from '../hooks/use-company'
import type { Company, CustomerAgentTrustLevel, ApprovalTimeoutAction } from '../types'

const trustLevelLabels: Record<CustomerAgentTrustLevel, string> = {
  FULL_CONTROL: 'Tam Kontrol',
  AUTO_MESSAGE: 'Otomatik Mesaj',
  AUTO_ALL_QUOTE_APPROVAL: 'Otomatik Teklif Onayı',
  FULLY_AUTOMATIC: 'Tam Otomatik',
}

const trustLevelHints: Record<CustomerAgentTrustLevel, string> = {
  FULL_CONTROL: 'Agent her aksiyonda onay bekler',
  AUTO_MESSAGE: 'Mesajlar otomatik, diğer aksiyonlar onaylı',
  AUTO_ALL_QUOTE_APPROVAL: 'Eşik altı teklifler otomatik onaylanır',
  FULLY_AUTOMATIC: 'Agent tamamen otonom çalışır',
}

const timeoutActionLabels: Record<ApprovalTimeoutAction, string> = {
  REMIND: 'Hatırlat',
  AUTO_SEND: 'Otomatik Gönder',
  HOLD: 'Beklet',
}

interface AgentSettingsCardProps {
  company: Company
}

export function AgentSettingsCard({ company }: AgentSettingsCardProps) {
  const [open, setOpen] = useState(false)
  const [trustLevel, setTrustLevel] = useState(company.customerAgentTrustLevel)
  const [threshold, setThreshold] = useState(company.autoApproveQuoteThreshold?.toString() ?? '')
  const [timeoutMinutes, setTimeoutMinutes] = useState(company.approvalTimeoutMinutes.toString())
  const [timeoutAction, setTimeoutAction] = useState(company.approvalTimeoutAction)
  const [budget, setBudget] = useState(company.customerOperationsBudgetUsd?.toString() ?? '')
  const updateCompany = useUpdateCompany(company.id)

  useEffect(() => {
    setTrustLevel(company.customerAgentTrustLevel)
    setThreshold(company.autoApproveQuoteThreshold?.toString() ?? '')
    setTimeoutMinutes(company.approvalTimeoutMinutes.toString())
    setTimeoutAction(company.approvalTimeoutAction)
    setBudget(company.customerOperationsBudgetUsd?.toString() ?? '')
  }, [
    company.customerAgentTrustLevel,
    company.autoApproveQuoteThreshold,
    company.approvalTimeoutMinutes,
    company.approvalTimeoutAction,
    company.customerOperationsBudgetUsd,
  ])

  const toNullable = (v: string) => (v === '' ? null : v)

  const hasChanges =
    trustLevel !== company.customerAgentTrustLevel ||
    toNullable(threshold) !== (company.autoApproveQuoteThreshold?.toString() ?? null) ||
    timeoutMinutes !== company.approvalTimeoutMinutes.toString() ||
    timeoutAction !== company.approvalTimeoutAction ||
    toNullable(budget) !== (company.customerOperationsBudgetUsd?.toString() ?? null)

  function handleSave() {
    updateCompany.mutate(
      {
        customerAgentTrustLevel: trustLevel,
        autoApproveQuoteThreshold: threshold !== '' ? Math.max(0, Number(threshold) || 0) : null,
        approvalTimeoutMinutes: Math.max(1, Number(timeoutMinutes) || 30),
        approvalTimeoutAction: timeoutAction,
        customerOperationsBudgetUsd: budget !== '' ? Math.max(0, Number(budget) || 0) : null,
      },
      {
        onSuccess: () => toast.success('Agent ayarları güncellendi'),
        onError: () => toast.error('Kaydetme başarısız'),
      },
    )
  }

  function handleReset() {
    setTrustLevel(company.customerAgentTrustLevel)
    setThreshold(company.autoApproveQuoteThreshold?.toString() ?? '')
    setTimeoutMinutes(company.approvalTimeoutMinutes.toString())
    setTimeoutAction(company.approvalTimeoutAction)
    setBudget(company.customerOperationsBudgetUsd?.toString() ?? '')
  }

  return (
    <div className="mb-4 rounded-lg border bg-card">
      <button
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium"
        onClick={() => setOpen(!open)}
      >
        <Bot className="h-4 w-4 text-muted-foreground" />
        <span>Agent Ayarları</span>
        <span className="ml-1 text-xs text-muted-foreground">
          {trustLevelLabels[company.customerAgentTrustLevel]}
        </span>
        {open ? (
          <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Güven Seviyesi</Label>
              <Select value={trustLevel} onValueChange={(v) => setTrustLevel(v as CustomerAgentTrustLevel)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(trustLevelLabels) as CustomerAgentTrustLevel[]).map((level) => (
                    <SelectItem key={level} value={level}>
                      {trustLevelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">{trustLevelHints[trustLevel]}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Otomatik Onay Eşiği ($)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Yok"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                disabled={trustLevel !== 'AUTO_ALL_QUOTE_APPROVAL'}
              />
              <p className="text-[11px] text-muted-foreground">Bu tutarın altındaki teklifler otomatik onaylanır</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Onay Zaman Aşımı (dk)</Label>
              <Input
                type="number"
                min={1}
                value={timeoutMinutes}
                onChange={(e) => setTimeoutMinutes(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Zaman Aşımı Aksiyonu</Label>
              <Select value={timeoutAction} onValueChange={(v) => setTimeoutAction(v as ApprovalTimeoutAction)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(timeoutActionLabels) as ApprovalTimeoutAction[]).map((action) => (
                    <SelectItem key={action} value={action}>
                      {timeoutActionLabels[action]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Operasyon Bütçesi ($)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Limitsiz"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">Aylık müşteri operasyonları bütçe limiti</p>
            </div>
          </div>

          {hasChanges && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
                {updateCompany.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                İptal
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
