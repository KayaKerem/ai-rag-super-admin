import { useState, useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
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
  const [search, setSearch] = useState('')

  useEffect(() => {
    const map = new Map<string, AllowedModel>()
    value.forEach((m) => map.set(m.id, m))
    setSelected(map)
  }, [value])

  const filtered = useMemo(() => {
    if (!search.trim()) return models
    const q = search.toLowerCase()
    return models.filter((m) => m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q))
  }, [models, search])

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    items: filtered.filter((m) => m.tier === tier),
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
    const map = new Map(selected)
    filtered.forEach((m) => {
      if (!map.has(m.id)) map.set(m.id, { id: m.id, label: m.label, tier: m.tier })
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
        <Label className="text-xs font-medium text-muted-foreground">
          Allowed Models ({selected.size} / {models.length})
        </Label>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={selectAll}>
            Tümünü Seç
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={clearAll}>
            Temizle
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Model ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
        {/* Selected models first */}
        {selected.size > 0 && !search.trim() && (
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary sticky top-0 bg-background py-0.5">
              Seçili ({selected.size})
            </div>
            <div className="space-y-1">
              {Array.from(selected.values()).map((am) => {
                const model = models.find((m) => m.id === am.id)
                if (!model) return null
                return (
                  <div
                    key={model.id}
                    className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Switch
                        checked={true}
                        onCheckedChange={() => toggleModel(model)}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium">{model.label}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground truncate">{model.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        ${model.pricing.inputPerMtok}/{model.pricing.outputPerMtok}
                      </span>
                      <Badge
                        variant={am.isDefault ? 'default' : 'outline'}
                        className="cursor-pointer text-[9px]"
                        onClick={() => toggleDefault(model.id)}
                      >
                        {am.isDefault ? 'Default' : 'Set Default'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All models by tier */}
        {grouped.map((group) => (
          <div key={group.tier}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-background py-0.5">
              {group.label} ({group.items.length})
            </div>
            <div className="space-y-1">
              {group.items.map((model) => {
                const isSelected = selected.has(model.id)
                const allowedModel = selected.get(model.id)
                return (
                  <div
                    key={model.id}
                    className={`flex items-center justify-between rounded-md border px-3 py-1.5 transition-colors ${isSelected ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleModel(model)}
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium">{model.label}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground truncate">{model.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        ${model.pricing.inputPerMtok}/{model.pricing.outputPerMtok}
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
        {grouped.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">Model bulunamadı</p>
        )}
      </div>
    </div>
  )
}
