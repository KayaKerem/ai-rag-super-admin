import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useUrlFilterState } from '@/lib/hooks/use-url-filter-state'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'
import { AgentRouteBindingsFilters } from '../components/agent-route-bindings-filters'
import { AgentRouteBindingsTable } from '../components/agent-route-bindings-table'
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selected, setSelected] = useState<AgentRouteBinding | null>(null)
  const { data, isLoading, isError, error, refetch } = useAgentRouteBindings(filters)

  function handleClearFilters() {
    setFilters({ agentId: null, channel: null, peerKind: null })
  }

  function handleRowClick(row: AgentRouteBinding) {
    setSelected(row)
    // Dialog open will be wired in PR 3
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
    </div>
  )
}
