import { useState, useEffect } from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useToolPlans } from '../hooks/use-tool-plans'
import { useCompanyToolConfig, useUpdateCompanyToolConfig } from '../hooks/use-company-tool-config'
import type { ResolvedTool } from '../types'

interface ToolConfigAccordionProps {
  companyId: string
}

export function ToolConfigAccordion({ companyId }: ToolConfigAccordionProps) {
  const { data: toolPlans } = useToolPlans()
  const { data: toolConfig } = useCompanyToolConfig(companyId)
  const updateToolConfig = useUpdateCompanyToolConfig(companyId)

  const [selectedPlan, setSelectedPlan] = useState('')
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (toolConfig) {
      setSelectedPlan(toolConfig.plan)
      setOverrides(toolConfig.overrides)
    }
  }, [toolConfig])

  const planIds = toolPlans ? Object.keys(toolPlans.plans) : []
  const hasConfig = !!toolConfig

  function handleToggle(toolId: string, currentEnabled: boolean, source: string) {
    const next = { ...overrides }
    if (source === 'plan' && currentEnabled) {
      // Disabling a plan tool → override false
      next[toolId] = false
    } else if (source === 'plan' && !currentEnabled) {
      // Re-enabling (remove override)
      delete next[toolId]
    } else if (source === 'not_in_plan' && !currentEnabled) {
      // Enabling a non-plan tool → override true
      next[toolId] = true
    } else if (source === 'override') {
      // Toggle off override → remove it
      delete next[toolId]
    } else {
      next[toolId] = !currentEnabled
    }
    setOverrides(next)
  }

  function handleSave() {
    updateToolConfig.mutate(
      { plan: selectedPlan, overrides },
      {
        onSuccess: () => toast.success('Tool config güncellendi'),
        onError: () => toast.error('Kaydetme başarısız'),
      }
    )
  }

  // Group resolved tools by category
  const grouped = (toolConfig?.resolvedTools ?? []).reduce<Record<string, ResolvedTool[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  const CATEGORY_LABELS: Record<string, string> = {
    search: 'Arama',
    template: 'Şablon',
    notes: 'Notlar',
  }

  return (
    <AccordionItem value="toolConfig" className="rounded-lg border">
      <AccordionTrigger className="rounded-lg bg-card px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-2">
          <span>🔧</span>
          <span className="text-sm font-semibold">Tool Config</span>
          <Badge variant={hasConfig ? 'default' : 'secondary'} className="text-[10px]">
            {hasConfig ? toolConfig.plan : 'Defaults'}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        {/* Plan selector */}
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground">Plan</Label>
          <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v ?? '')}>
            <SelectTrigger className="mt-1 w-full max-w-xs">
              <SelectValue placeholder="Plan seçin" />
            </SelectTrigger>
            <SelectContent>
              {planIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {toolPlans!.plans[id].label} ({id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {toolPlans?.plans[selectedPlan] && (
            <p className="mt-1 text-[10px] text-muted-foreground">{toolPlans.plans[selectedPlan].description}</p>
          )}
        </div>

        {/* Tool toggles */}
        {Object.entries(grouped).map(([category, tools]) => (
          <div key={category} className="mb-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABELS[category] ?? category}
            </div>
            <div className="space-y-1">
              {tools.map((tool) => {
                // Use local overrides to compute current state
                const hasOverride = tool.id in overrides
                const localEnabled = hasOverride ? overrides[tool.id] : tool.enabled

                return (
                  <div
                    key={tool.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 ${localEnabled ? 'border-primary/20 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={localEnabled}
                        onCheckedChange={() => handleToggle(tool.id, localEnabled, hasOverride ? 'override' : tool.source)}
                      />
                      <div>
                        <span className="text-xs font-medium">{tool.label}</span>
                        {tool.requiresApproval && (
                          <Badge variant="outline" className="ml-1.5 text-[9px]">Onay Gerekli</Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[9px]"
                    >
                      {hasOverride ? 'override' : tool.source}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-4 flex justify-end border-t pt-3">
          <Button size="sm" disabled={updateToolConfig.isPending} onClick={handleSave}>
            {updateToolConfig.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
