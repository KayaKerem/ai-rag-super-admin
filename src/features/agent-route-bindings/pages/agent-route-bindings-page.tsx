import { Loader2 } from 'lucide-react'
import { useAgentRouteBindings } from '../hooks/use-agent-route-bindings'

const EMPTY_FILTERS = { agentId: null, channel: null, peerKind: null }

export function AgentRouteBindingsPage() {
  const { data, isLoading, isError } = useAgentRouteBindings(EMPTY_FILTERS)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <h1 className="mb-2 text-xl font-bold">Agent Routing</h1>
        <p className="text-sm text-destructive">Yüklenemedi. Sayfayı yenileyin.</p>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Agent Routing</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} binding · agent + channel + peer eşlemesi
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
          Henüz binding yok.
        </div>
      ) : (
        <div className="rounded-md border p-4 text-sm">
          {items.length} binding (tablo PR 2'de eklenecek)
        </div>
      )}
    </div>
  )
}
