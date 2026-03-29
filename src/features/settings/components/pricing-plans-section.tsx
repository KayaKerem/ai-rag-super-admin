import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { usePricingPlans, useCreatePricingPlan, useUpdatePricingPlan, useDeletePricingPlan } from '@/features/companies/hooks/use-pricing-plans'
import { usePlatformModels } from '@/features/companies/hooks/use-platform-models'
import { useToolPlans } from '@/features/companies/hooks/use-tool-plans'
import { useDataSourceTypes } from '@/features/companies/hooks/use-data-sources'
import { AllowedModelsEditor } from '@/features/companies/components/allowed-models-editor'
import { formatCurrencyTry } from '@/lib/utils'
import type { PricingPlan, CreatePlanRequest, AllowedModel, PlatformModel, RegisteredTool, DataSourceType, DeletePlanResponse } from '@/features/companies/types'

interface PlanFormData {
  name: string
  slug: string
  description: string
  monthlyPriceTry: string
  includedUsers: string
  extraUserPriceTry: string
  budgetUsd: string
  budgetDowngradeThresholdPct: string
  maxStorageGb: string
  maxFileSizeMb: string
  crawlMaxPages: string
  crawlMaxSources: string
  allowedModels: Array<{ id: string; label: string }>
  allowedTools: string[]
  allowedConnectors: string[]
  isActive: boolean
  sortOrder: string
}

const emptyForm: PlanFormData = {
  name: '', slug: '', description: '',
  monthlyPriceTry: '', includedUsers: '1', extraUserPriceTry: '',
  budgetUsd: '10', budgetDowngradeThresholdPct: '80',
  maxStorageGb: '5', maxFileSizeMb: '25',
  crawlMaxPages: '50', crawlMaxSources: '2',
  allowedModels: [], allowedTools: [], allowedConnectors: [],
  isActive: true, sortOrder: '0',
}

function planToForm(p: PricingPlan): PlanFormData {
  return {
    name: p.name, slug: p.slug, description: p.description ?? '',
    monthlyPriceTry: p.monthlyPriceTry !== null ? String(p.monthlyPriceTry) : '',
    includedUsers: String(p.includedUsers),
    extraUserPriceTry: p.extraUserPriceTry !== null ? String(p.extraUserPriceTry) : '',
    budgetUsd: String(p.budgetUsd),
    budgetDowngradeThresholdPct: String(p.budgetDowngradeThresholdPct),
    maxStorageGb: String(p.maxStorageGb), maxFileSizeMb: String(p.maxFileSizeMb),
    crawlMaxPages: String(p.crawlMaxPages), crawlMaxSources: String(p.crawlMaxSources),
    allowedModels: p.allowedModels, allowedTools: p.allowedTools, allowedConnectors: p.allowedConnectors,
    isActive: p.isActive, sortOrder: String(p.sortOrder),
  }
}

function formToRequest(f: PlanFormData): CreatePlanRequest {
  return {
    name: f.name, slug: f.slug,
    description: f.description || undefined,
    monthlyPriceTry: f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null,
    includedUsers: Number(f.includedUsers) || 1,
    extraUserPriceTry: f.extraUserPriceTry ? Number(f.extraUserPriceTry) : null,
    budgetUsd: Number(f.budgetUsd) || 10,
    budgetDowngradeThresholdPct: Number(f.budgetDowngradeThresholdPct) || 80,
    maxStorageGb: Number(f.maxStorageGb) || 5, maxFileSizeMb: Number(f.maxFileSizeMb) || 25,
    crawlMaxPages: Number(f.crawlMaxPages) || 50, crawlMaxSources: Number(f.crawlMaxSources) || 2,
    allowedModels: f.allowedModels, allowedTools: f.allowedTools, allowedConnectors: f.allowedConnectors,
    isActive: f.isActive, sortOrder: Number(f.sortOrder) || 0,
  }
}

export function PricingPlansSection() {
  const { data: plans, isLoading } = usePricingPlans(true)
  const { data: models } = usePlatformModels()
  const { data: toolPlansData } = useToolPlans()
  const { data: connectorTypes } = useDataSourceTypes()
  const createPlan = useCreatePricingPlan()
  const deletePlan = useDeletePricingPlan()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [form, setForm] = useState<PlanFormData>(emptyForm)

  const registeredTools = toolPlansData?.registeredTools ?? []

  function openCreate() {
    setEditingPlan(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(plan: PricingPlan) {
    setEditingPlan(plan)
    setForm(planToForm(plan))
    setDialogOpen(true)
  }

  function handleToolToggle(toolId: string, checked: boolean) {
    setForm((prev) => {
      if (toolId === '*') return { ...prev, allowedTools: checked ? ['*'] : [] }
      const isWild = prev.allowedTools.includes('*')
      if (isWild && !checked) return prev
      const next = checked
        ? [...prev.allowedTools.filter((t) => t !== '*'), toolId]
        : prev.allowedTools.filter((t) => t !== toolId)
      return { ...prev, allowedTools: next }
    })
  }

  function handleConnectorToggle(type: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      allowedConnectors: checked
        ? [...prev.allowedConnectors, type]
        : prev.allowedConnectors.filter((c) => c !== type),
    }))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fiyatlandırma Planları</h2>
          <p className="text-sm text-muted-foreground">Plan oluştur, düzenle ve firmalara ata</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Yeni Plan
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Fiyat</TableHead>
                <TableHead className="text-right">Dahil Kul.</TableHead>
                <TableHead className="text-right">Depolama</TableHead>
                <TableHead className="text-right">Firma</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(plans ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="outline">{p.slug}</Badge></TableCell>
                  <TableCell className="text-right">
                    {p.monthlyPriceTry !== null ? formatCurrencyTry(p.monthlyPriceTry) : 'Kurumsal'}
                  </TableCell>
                  <TableCell className="text-right">{p.includedUsers}</TableCell>
                  <TableCell className="text-right">{p.maxStorageGb} GB</TableCell>
                  <TableCell className="text-right">{p.companyCount}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPlan={editingPlan}
        form={form}
        setForm={setForm}
        models={models ?? []}
        registeredTools={registeredTools}
        connectorTypes={connectorTypes ?? []}
        onToolToggle={handleToolToggle}
        onConnectorToggle={handleConnectorToggle}
        onCreate={createPlan}
        onDelete={deletePlan}
      />
    </div>
  )
}

// ─── Plan Dialog ────────────────────────────────

interface PlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPlan: PricingPlan | null
  form: PlanFormData
  setForm: React.Dispatch<React.SetStateAction<PlanFormData>>
  models: PlatformModel[]
  registeredTools: RegisteredTool[]
  connectorTypes: DataSourceType[]
  onToolToggle: (toolId: string, checked: boolean) => void
  onConnectorToggle: (type: string, checked: boolean) => void
  onCreate: ReturnType<typeof useCreatePricingPlan>
  onDelete: ReturnType<typeof useDeletePricingPlan>
}

function PlanDialog({
  open, onOpenChange, editingPlan, form, setForm,
  models, registeredTools, connectorTypes,
  onToolToggle, onConnectorToggle, onCreate, onDelete,
}: PlanDialogProps) {
  const updatePlan = useUpdatePricingPlan(editingPlan?.id ?? '')
  const isEdit = !!editingPlan

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body = formToRequest(form)
    if (isEdit) {
      const { slug: _, ...updateBody } = body
      updatePlan.mutate(updateBody, {
        onSuccess: () => { toast.success('Plan güncellendi'); onOpenChange(false) },
        onError: () => toast.error('Güncelleme başarısız'),
      })
    } else {
      onCreate.mutate(body, {
        onSuccess: () => { toast.success('Plan oluşturuldu'); onOpenChange(false) },
        onError: () => toast.error('Oluşturma başarısız'),
      })
    }
  }

  function handleDeactivate() {
    if (!editingPlan) return
    onDelete.mutate(editingPlan.id, {
      onSuccess: (res: DeletePlanResponse) => {
        const msg = res.warning ? `Plan deaktif edildi. ${res.warning}` : 'Plan deaktif edildi'
        toast.success(msg)
        onOpenChange(false)
      },
      onError: () => toast.error('Deaktif etme başarısız'),
    })
  }

  function setField(key: keyof PlanFormData, value: PlanFormData[keyof PlanFormData]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isWildcard = form.allowedTools.includes('*')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Temel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>İsim *</Label><Input value={form.name} onChange={(e) => setField('name', e.target.value)} required /></div>
              <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setField('slug', e.target.value)} disabled={isEdit} required pattern="^[a-z0-9-]{2,50}$" /></div>
            </div>
            <div><Label>Açıklama</Label><Input value={form.description} onChange={(e) => setField('description', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Aylık Fiyat (TRY)</Label><Input type="number" value={form.monthlyPriceTry} onChange={(e) => setField('monthlyPriceTry', e.target.value)} placeholder="Boş = Kurumsal" /></div>
              <div><Label>Dahil Kullanıcı</Label><Input type="number" value={form.includedUsers} onChange={(e) => setField('includedUsers', e.target.value)} /></div>
              <div><Label>Ek Kul. Fiyat (TRY)</Label><Input type="number" value={form.extraUserPriceTry} onChange={(e) => setField('extraUserPriceTry', e.target.value)} placeholder="Boş = yok" /></div>
            </div>
          </div>

          {/* Limitler */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Limitler</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>AI Bütçe (USD)</Label><Input type="number" value={form.budgetUsd} onChange={(e) => setField('budgetUsd', e.target.value)} /></div>
              <div><Label>Bütçe Uyarı %</Label><Input type="number" value={form.budgetDowngradeThresholdPct} onChange={(e) => setField('budgetDowngradeThresholdPct', e.target.value)} /></div>
              <div><Label>Maks Depolama (GB)</Label><Input type="number" value={form.maxStorageGb} onChange={(e) => setField('maxStorageGb', e.target.value)} /></div>
              <div><Label>Maks Dosya (MB)</Label><Input type="number" value={form.maxFileSizeMb} onChange={(e) => setField('maxFileSizeMb', e.target.value)} /></div>
              <div><Label>Crawler Maks Sayfa</Label><Input type="number" value={form.crawlMaxPages} onChange={(e) => setField('crawlMaxPages', e.target.value)} /></div>
              <div><Label>Crawler Maks Kaynak</Label><Input type="number" value={form.crawlMaxSources} onChange={(e) => setField('crawlMaxSources', e.target.value)} /></div>
            </div>
          </div>

          {/* Tool'lar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Tool&apos;lar</h3>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isWildcard} onCheckedChange={(c) => onToolToggle('*', c)} />
              <span>Tüm tool&apos;lara izin ver (wildcard)</span>
            </label>
            {!isWildcard && (
              <div className="grid grid-cols-2 gap-2">
                {registeredTools.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={form.allowedTools.includes(t.id)}
                      onCheckedChange={(c) => onToolToggle(t.id, c)}
                    />
                    <span>{t.label}</span>
                    {t.requiresApproval && <Badge variant="outline" className="text-[10px]">Onay</Badge>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Modeller */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Modeller</h3>
            <AllowedModelsEditor
              models={models}
              value={form.allowedModels.map((m) => ({ ...m, isDefault: false }))}
              onChange={(v: AllowedModel[]) => setField('allowedModels', v.map(({ id, label }) => ({ id, label: label ?? id })))}
            />
          </div>

          {/* Connector'lar */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">İzin Verilen Connector&apos;lar</h3>
            <div className="grid grid-cols-2 gap-2">
              {(connectorTypes ?? []).map((ct) => (
                <label key={ct.type} className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.allowedConnectors.includes(ct.type)}
                    onCheckedChange={(c) => onConnectorToggle(ct.type, c)}
                  />
                  <span>{ct.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sıralama & Durum */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Sıralama</Label><Input type="number" value={form.sortOrder} onChange={(e) => setField('sortOrder', e.target.value)} /></div>
            <div className="flex items-end gap-2">
              <Label>Aktif</Label>
              <Switch checked={form.isActive} onCheckedChange={(c) => setField('isActive', c)} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            {isEdit && editingPlan?.isActive && (
              <Button type="button" variant="outline" className="text-destructive" onClick={handleDeactivate} disabled={onDelete.isPending}>
                Deaktif Et
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
              <Button type="submit" disabled={onCreate.isPending || updatePlan.isPending}>
                {isEdit ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
