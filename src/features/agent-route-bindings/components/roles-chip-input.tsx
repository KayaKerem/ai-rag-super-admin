import { useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { ROLE_REGEX } from '../types'

interface RolesChipInputProps {
  value: string[]
  onChange: (next: string[]) => void
  maxChips?: number
  placeholder?: string
  disabled?: boolean
}

export function RolesChipInput({
  value,
  onChange,
  maxChips = 10,
  placeholder = 'Rol ekle ve Enter…',
  disabled,
}: RolesChipInputProps) {
  const [draft, setDraft] = useState('')

  function tryAdd(raw: string): boolean {
    const candidate = raw.trim()
    if (candidate === '') return false
    if (!ROLE_REGEX.test(candidate)) {
      toast.error(`Geçersiz rol "${candidate}" — sadece A-Z, a-z, 0-9, _, - (1-50 karakter)`)
      return false
    }
    if (value.includes(candidate)) {
      toast.error(`"${candidate}" zaten ekli`)
      return false
    }
    if (value.length >= maxChips) {
      toast.error(`En fazla ${maxChips} rol`)
      return false
    }
    onChange([...value, candidate])
    return true
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (tryAdd(draft)) setDraft('')
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text')
    if (!text.includes(',')) return
    e.preventDefault()
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
    let next = value
    let added = 0
    let skipped = 0
    for (const part of parts) {
      if (next.length >= maxChips) {
        skipped++
        continue
      }
      if (!ROLE_REGEX.test(part) || next.includes(part)) {
        skipped++
        continue
      }
      added++
      next = [...next, part]
    }
    if (added > 0) onChange(next)
    if (skipped > 0) {
      toast.message(`${added} rol eklendi, ${skipped} atlandı`)
    }
  }

  function removeChip(role: string) {
    onChange(value.filter((r) => r !== role))
  }

  const reachedMax = value.length >= maxChips

  return (
    <div className="flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5">
      {value.map((role) => (
        <Badge key={role} variant="secondary" className="gap-1 pl-2 pr-1">
          <span>{role}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(role)}
              aria-label={`Rolü kaldır: ${role}`}
              className="rounded hover:bg-background/50"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {!reachedMax && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="h-6 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      )}
    </div>
  )
}
