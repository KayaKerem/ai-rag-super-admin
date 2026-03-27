import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useToolPlans, useUpdateToolPlans } from '@/features/companies/hooks/use-tool-plans'
import type { ToolPlan, RegisteredTool } from '@/features/companies/types'
import { Plus, Trash2 } from 'lucide-react'

export function ToolPlansSection() {
  const { data: toolPlansData } = useToolPlans()
  const updateToolPlans = useUpdateToolPlans()

  const [defaultPlan, setDefaultPlan] = useState('')
  const [plans, setPlans] = useState<Record<string, ToolPlan>>({})
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [newPlanId, setNewPlanId] = useState('')
  const [newPlanLabel, setNewPlanLabel] = useState('')
  const [newPlanDesc, setNewPlanDesc] = useState('')

  useEffect(() => {
    if (toolPlansData) {
      setDefaultPlan(toolPlansData.defaultPlan)
      setPlans(JSON.parse(JSON.stringify(toolPlansData.plans)))
    }
  }, [toolPlansData])

  const registeredTools: RegisteredTool[] = toolPlansData?.registeredTools ?? []
  const planIds = Object.keys(plans)

  function handleSave() {
    updateToolPlans.mutate(
      { defaultPlan, plans },
      {
        onSuccess: () => toast.success('Tool planları kaydedildi'),
        onError: () => toast.error('Kaydetme başarısız'),
      }
    )
  }

  function addPlan() {
    const id = newPlanId.trim().toLowerCase().replace(/\s+/g, '-')
    if (!id || id.length < 2 || plans[id]) return
    setPlans({ ...plans, [id]: { label: newPlanLabel || id, description: newPlanDesc, tools: [] } })
    setNewPlanId('')
    setNewPlanLabel('')
    setNewPlanDesc('')
    setEditingPlan(id)
  }

  function deletePlan(id: string) {
    if (id === defaultPlan) {
      toast.error('Default plan silinemez')
      return
    }
    const next = { ...plans }
    delete next[id]
    setPlans(next)
    if (editingPlan === id) setEditingPlan(null)
  }

  function toggleToolInPlan(planId: string, toolId: string) {
    const plan = plans[planId]
    if (!plan) return
    const isWildcard = plan.tools.includes('*')
    if (isWildcard) return

    const next = { ...plans }
    const tools = [...plan.tools]
    const idx = tools.indexOf(toolId)
    if (idx >= 0) {
      tools.splice(idx, 1)
    } else {
      tools.push(toolId)
    }
    next[planId] = { ...plan, tools }
    setPlans(next)
  }

  function toggleWildcard(planId: string) {
    const plan = plans[planId]
    if (!plan) return
    const next = { ...plans }
    if (plan.tools.includes('*')) {
      next[planId] = { ...plan, tools: [] }
    } else {
      next[planId] = { ...plan, tools: ['*'] }
    }
    setPlans(next)
  }

  function updatePlanField(planId: string, field: 'label' | 'description', value: string) {
    const next = { ...plans }
    next[planId] = { ...next[planId], [field]: value }
    setPlans(next)
  }

  const editPlan = editingPlan ? plans[editingPlan] : null

  const CATEGORY_LABELS: Record<string, string> = { search: 'Arama', template: 'Şablon', notes: 'Notlar' }
  const grouped = registeredTools.reduce<Record<string, RegisteredTool[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Tool Planları</h2>
        <p className="mt-1 text-sm text-muted-foreground">Plan bazlı tool erişim yönetimi. Firmalara plan atayarak hangi tool'ları kullanabileceklerini belirleyin.</p>
      </div>

      {/* Default Plan */}
      <div className="mb-4">
        <Label className="text-xs text-muted-foreground">Default Plan (yeni firmalara atanır)</Label>
        <Select value={defaultPlan} onValueChange={setDefaultPlan}>
          <SelectTrigger className="mt-1 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {planIds.map((id) => (
              <SelectItem key={id} value={id}>{plans[id].label} ({id})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      {/* Plan List */}
      <div className="mb-4">
        <Label className="text-xs font-medium text-muted-foreground">Planlar</Label>
        <div className="mt-2 space-y-1">
          {planIds.map((id) => {
            const plan = plans[id]
            const isEditing = editingPlan === id
            const toolCount = plan.tools.includes('*') ? 'Tümü' : plan.tools.length
            return (
              <div
                key={id}
                className={`flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer transition-colors ${isEditing ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                onClick={() => setEditingPlan(isEditing ? null : id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{plan.label}</span>
                  <Badge variant="secondary" className="text-[9px]">{id}</Badge>
                  {id === defaultPlan && <Badge variant="default" className="text-[9px]">Default</Badge>}
                  <span className="text-[10px] text-muted-foreground">{toolCount} tool</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); deletePlan(id) }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* New Plan */}
      <div className="mb-4 flex items-end gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Plan ID</Label>
          <Input className="mt-0.5 h-8 w-28 text-xs" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)} placeholder="basic" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Label</Label>
          <Input className="mt-0.5 h-8 w-32 text-xs" value={newPlanLabel} onChange={(e) => setNewPlanLabel(e.target.value)} placeholder="Temel" />
        </div>
        <div className="flex-1">
          <Label className="text-[10px] text-muted-foreground">Açıklama</Label>
          <Input className="mt-0.5 h-8 text-xs" value={newPlanDesc} onChange={(e) => setNewPlanDesc(e.target.value)} placeholder="Plan açıklaması" />
        </div>
        <Button type="button" size="sm" className="h-8" onClick={addPlan} disabled={!newPlanId.trim()}>
          <Plus className="mr-1 h-3 w-3" /> Ekle
        </Button>
      </div>

      {/* Plan Editor */}
      {editPlan && editingPlan && (
        <>
          <Separator className="my-4" />
          <div className="mb-3">
            <h3 className="text-sm font-semibold">{editPlan.label} — Tool Düzenle</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Label</Label>
                <Input className="mt-0.5 h-8 text-xs" value={editPlan.label} onChange={(e) => updatePlanField(editingPlan, 'label', e.target.value)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Açıklama</Label>
                <Input className="mt-0.5 h-8 text-xs" value={editPlan.description} onChange={(e) => updatePlanField(editingPlan, 'description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Wildcard Toggle */}
          <div className="mb-3 flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <span className="text-xs font-medium">Tüm Tool'lar (Wildcard)</span>
              <span className="ml-1.5 text-[10px] text-muted-foreground">["*"] — enterprise planlar için</span>
            </div>
            <Switch
              checked={editPlan.tools.includes('*')}
              onCheckedChange={() => toggleWildcard(editingPlan)}
            />
          </div>

          {/* Tool checkboxes by category */}
          {!editPlan.tools.includes('*') && Object.entries(grouped).map(([category, tools]) => (
            <div key={category} className="mb-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {CATEGORY_LABELS[category] ?? category}
              </div>
              <div className="space-y-1">
                {tools.map((tool) => {
                  const isInPlan = editPlan.tools.includes(tool.id)
                  return (
                    <div key={tool.id} className={`flex items-center justify-between rounded-md border px-3 py-2 ${isInPlan ? 'border-primary/20 bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Switch checked={isInPlan} onCheckedChange={() => toggleToolInPlan(editingPlan, tool.id)} />
                        <div>
                          <span className="text-xs font-medium">{tool.label}</span>
                          <span className="ml-1.5 text-[10px] text-muted-foreground">{tool.description}</span>
                        </div>
                      </div>
                      {tool.requiresApproval && <Badge variant="outline" className="text-[9px]">Onay</Badge>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Registered Tools Reference */}
      <Separator className="my-4" />
      <div>
        <Label className="text-[10px] text-muted-foreground">Kayıtlı Tool'lar (read-only, sistem tarafından belirlenir)</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          {registeredTools.map((t) => (
            <Badge key={t.id} variant="secondary" className="text-[9px]">
              {t.id}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end border-t pt-4">
        <Button disabled={updateToolPlans.isPending} onClick={handleSave}>
          {updateToolPlans.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
