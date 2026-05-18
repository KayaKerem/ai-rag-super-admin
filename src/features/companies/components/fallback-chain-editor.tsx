import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ModelSelect } from '@/components/ui/model-select'
import { ArrowUp, ArrowDown, X } from 'lucide-react'
import type { PlatformModel } from '../types'

interface FallbackChainEditorProps {
  models: PlatformModel[]
  value: string[]
  onChange: (chain: string[]) => void
}

export function FallbackChainEditor({ models, value, onChange }: FallbackChainEditorProps) {
  const [pending, setPending] = useState('')

  function add() {
    if (!pending || value.includes(pending)) return
    onChange([...value, pending])
    setPending('')
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="col-span-2 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Fallback Zinciri ({value.length})
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Birincil model rate_limit / overloaded ile başarısız olursa sırayla denenir. Boş ise fallback yok (mevcut tek-model davranışı).
      </p>
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((id, i) => {
            const model = models.find((m) => m.id === id)
            return (
              <div key={id} className="flex items-center gap-1 rounded-md border px-2 py-1">
                <span className="w-4 text-[10px] text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 truncate text-xs">
                  {model ? (
                    <>
                      <span className="font-medium">{model.label}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">{model.id}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">{id}</span>
                  )}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Yukarı taşı"
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={i === value.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Aşağı taşı"
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => remove(id)}
                  aria-label="Kaldır"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <ModelSelect
            models={models}
            value={pending}
            onChange={setPending}
            placeholder="Model ekle..."
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={add}
          disabled={!pending || value.includes(pending)}
        >
          Ekle
        </Button>
      </div>
    </div>
  )
}
