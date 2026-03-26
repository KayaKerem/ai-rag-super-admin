import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { PlatformModel, AllowedModel } from '../types'

interface AllowedModelsEditorProps {
  models: PlatformModel[]
  value: AllowedModel[]
  onChange: (models: AllowedModel[]) => void
}

const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  standard: 'Standard',
  economy: 'Economy',
}

const TIER_ORDER = ['premium', 'standard', 'economy']

export function AllowedModelsEditor({ models, value, onChange }: AllowedModelsEditorProps) {
  const [selected, setSelected] = useState<Map<string, AllowedModel>>(new Map())

  useEffect(() => {
    const map = new Map<string, AllowedModel>()
    value.forEach((m) => map.set(m.id, m))
    setSelected(map)
  }, [value])

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    items: models.filter((m) => m.tier === tier),
  })).filter((g) => g.items.length > 0)

  function toggleModel(model: PlatformModel) {
    const next = new Map(selected)
    if (next.has(model.id)) {
      next.delete(model.id)
    } else {
      next.set(model.id, { id: model.id, label: model.label, tier: model.tier })
    }
    setSelected(next)
    onChange(Array.from(next.values()))
  }

  function toggleDefault(modelId: string) {
    const next = new Map(selected)
    const existing = next.get(modelId)
    if (!existing) return
    next.set(modelId, { ...existing, isDefault: !existing.isDefault })
    setSelected(next)
    onChange(Array.from(next.values()))
  }

  function selectAll() {
    const map = new Map<string, AllowedModel>()
    models.forEach((m) => {
      const existing = selected.get(m.id)
      map.set(m.id, existing ?? { id: m.id, label: m.label, tier: m.tier })
    })
    setSelected(map)
    onChange(Array.from(map.values()))
  }

  function clearAll() {
    setSelected(new Map())
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">Allowed Models</Label>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={selectAll}>
            Tümünü Seç
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={clearAll}>
            Temizle
          </Button>
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.tier}>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </div>
          <div className="space-y-1">
            {group.items.map((model) => {
              const isSelected = selected.has(model.id)
              const allowedModel = selected.get(model.id)
              return (
                <div
                  key={model.id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => toggleModel(model)}
                    />
                    <div>
                      <span className="text-xs font-medium">{model.label}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground">{model.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      ${model.pricing.inputPerMtok}/{model.pricing.outputPerMtok} /Mtok
                    </span>
                    {isSelected && (
                      <Badge
                        variant={allowedModel?.isDefault ? 'default' : 'outline'}
                        className="cursor-pointer text-[9px]"
                        onClick={() => toggleDefault(model.id)}
                      >
                        {allowedModel?.isDefault ? 'Default' : 'Set Default'}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
