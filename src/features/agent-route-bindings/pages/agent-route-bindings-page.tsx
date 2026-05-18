import { useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'
import { AgentRouteBindingsFilters } from '../components/agent-route-bindings-filters'
import { AgentRouteBindingsTable } from '../components/agent-route-bindings-table'
import { AgentRouteBindingDialog } from '../components/agent-route-binding-dialog'
import type { AgentRouteBinding, AgentRouteBindingsFilters as Filters, PeerKind } from '../types'

const URL_STATE_OPTS = {
  defaults: { agentId: null, channel: null, peerKind: null } as Filters,
  parse: (params: URLSearchParams): Filters => {
    const pk = params.get('peerKind')
    return {
      agentId: params.get('agentId'),
      channel: params.get('channel'),
      peerKind: pk === 'customer' || pk === 'user' ? (pk as PeerKind) : null,
    }
  },
  serialize: (v: Filters) => ({
    agentId: v.agentId ?? undefined,
    channel: v.channel ?? undefined,
    peerKind: v.peerKind ?? undefined,
  }),
}

export function AgentRouteBindingsPage() {
  const [filters, setFilters] = useUrlFilterState<Filters>(URL_STATE_OPTS)
  const [selected, setSelected] = useState<AgentRouteBinding | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading, isError, error, refetch } = useAgentRouteBindings(filters)

  // Parent state contract (spec §7.4): when list refetches after a mutation,
  // re-pick `selected` from the fresh list. Handles 409 version conflict refresh
  // and concurrent DELETE edge case. setState in effect is intentional — this
  // re-syncs an internal selection snapshot with the authoritative server list
  // (an external source), which is the supported use of effects.
  useEffect(() => {
    if (!selected) return
    const fresh = data?.items.find((b) => b.id === selected.id)
    if (fresh && fresh.versionSeq !== selected.versionSeq) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(fresh)
    } else if (!fresh && dialogOpen && data !== undefined) {
      setSelected(null)
      setDialogOpen(false)
      toast.error('Bu binding silinmiş. Liste yenilendi.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selected?.id])

  function handleClearFilters() {
    setFilters({ agentId: null, channel: null, peerKind: null })
  }

  function handleRowClick(row: AgentRouteBinding) {
    setSelected(row)
    setDialogOpen(true)
  }

  function handleCreate() {
    setSelected(null)
    setDialogOpen(true)
  }

  if (isError) {
    const status =
      (error as { response?: { status?: number } } | undefined)?.response?.status ?? 0
    const isForbidden = status === 403
    const isZodParseError = (error as { name?: string } | undefined)?.name === 'ZodError'

    return (
      <div>
        <h1 className="mb-2 text-xl font-bold">Agent Routing</h1>
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-sm">
          {isForbidden ? (
            <p className="text-destructive">
              Bu sayfayı görmek için platform admin yetkisi gerekli.
            </p>
          ) : isZodParseError ? (
            <p className="text-destructive">
              Veri formatı beklenmedik — backend response Zod parse'tan geçmedi. Devops uyarıldı mı?
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-destructive">
                Binding'ler yüklenemedi. {status > 0 && `(HTTP ${status})`}
              </p>
              <button
                onClick={() => refetch()}
                className="text-xs underline hover:text-foreground"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Agent Routing</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} binding · agent + channel + peer eşlemesi
          </p>
        </div>
        <Button size="sm" onClick={handleCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Yeni
        </Button>
      </div>

      <div className="mb-4">
        <AgentRouteBindingsFilters
          value={filters}
          onChange={(next) => setFilters(next)}
          onClear={handleClearFilters}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AgentRouteBindingsTable rows={items} onRowClick={handleRowClick} />
      )}

      <AgentRouteBindingDialog
        binding={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
