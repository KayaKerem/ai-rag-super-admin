import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import {
  AGENT_OPTIONS,
  KNOWN_CHANNELS,
  PEER_KIND_OPTIONS,
  type AgentRouteBindingsFilters as Filters,
  type PeerKind,
} from '../types'

const ALL = '__all__'

interface AgentRouteBindingsFiltersProps {
  value: Filters
  onChange: (next: Partial<Filters>) => void
  onClear: () => void
}

export function AgentRouteBindingsFilters({ value, onChange, onClear }: AgentRouteBindingsFiltersProps) {
  const hasFilter = value.agentId !== null || value.channel !== null || value.peerKind !== null

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-agent" className="text-xs text-muted-foreground">Agent</Label>
        <Select
          value={value.agentId ?? ALL}
          onValueChange={(v) => onChange({ agentId: v === ALL ? null : v })}
        >
          <SelectTrigger id="filter-agent" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {AGENT_OPTIONS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-channel" className="text-xs text-muted-foreground">Kanal</Label>
        <Select
          value={value.channel ?? ALL}
          onValueChange={(v) => onChange({ channel: v === ALL ? null : v })}
        >
          <SelectTrigger id="filter-channel" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {KNOWN_CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="filter-peer-kind" className="text-xs text-muted-foreground">Peer Türü</Label>
        <Select
          value={value.peerKind ?? ALL}
          onValueChange={(v) =>
            onChange({ peerKind: v === ALL ? null : (v as PeerKind) })
          }
        >
          <SelectTrigger id="filter-peer-kind" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Hepsi</SelectItem>
            {PEER_KIND_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9">
          <X className="mr-1 h-3.5 w-3.5" /> Temizle
        </Button>
      )}
    </div>
  )
}
