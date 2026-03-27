import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronDown, X } from 'lucide-react'
import type { PlatformModel } from '@/features/companies/types'

interface ModelSelectProps {
  models: PlatformModel[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const TIER_COLORS: Record<string, string> = {
  premium: 'bg-amber-500/10 text-amber-600',
  standard: 'bg-blue-500/10 text-blue-600',
  economy: 'bg-green-500/10 text-green-600',
}

export function ModelSelect({ models, value, onChange, placeholder = 'Model seçin...' }: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return models
    const q = search.toLowerCase()
    return models.filter((m) => m.id.toLowerCase().includes(q) || m.label.toLowerCase().includes(q))
  }, [models, search])

  const grouped = useMemo(() => {
    const tiers = ['premium', 'standard', 'economy'] as const
    return tiers.map((tier) => ({
      tier,
      items: filtered.filter((m) => m.tier === tier),
    })).filter((g) => g.items.length > 0)
  }, [filtered])

  const selectedModel = models.find((m) => m.id === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors hover:bg-accent/50 mt-1"
      >
        {selectedModel ? (
          <span className="flex items-center gap-1.5 truncate">
            <span>{selectedModel.label}</span>
            <span className="text-[10px] text-muted-foreground">{selectedModel.id}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {value && (
            <X
              className="h-3 w-3 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false) }}
            />
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-1.5">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Model ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {grouped.map((group) => (
              <div key={group.tier}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-popover">
                  {group.tier} ({group.items.length})
                </div>
                {group.items.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => { onChange(model.id); setOpen(false); setSearch('') }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors ${value === model.id ? 'bg-accent' : ''}`}
                  >
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{model.label}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">{model.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="outline" className={`text-[9px] ${TIER_COLORS[model.tier] ?? ''}`}>
                        ${model.pricing.inputPerMtok}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="py-3 text-center text-xs text-muted-foreground">Model bulunamadı</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
