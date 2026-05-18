import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useDeleteAgentRouteBinding } from '../hooks/use-agent-route-bindings'
import { parseRouteBindingError } from '../lib/parse-error'
import { getAgentLabel, type AgentRouteBinding } from '../types'

interface AgentRouteBindingDeleteDialogProps {
  binding: AgentRouteBinding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentRouteBindingDeleteDialog({
  binding,
  open,
  onOpenChange,
}: AgentRouteBindingDeleteDialogProps) {
  const deleteMutation = useDeleteAgentRouteBinding()

  function handleConfirm() {
    if (!binding) return
    deleteMutation.mutate(binding.id, {
      onSuccess: () => {
        toast.success('Binding silindi')
        onOpenChange(false)
      },
      onError: (err) => {
        const parsed = parseRouteBindingError(err)
        if (parsed.status === 404) {
          toast.message('Bu binding zaten silinmiş.')
          onOpenChange(false)
          return
        }
        toast.error('Silme başarısız')
      },
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Binding'i Sil</AlertDialogTitle>
          <AlertDialogDescription>
            {binding && (
              <span className="block space-y-1 text-sm">
                <span className="block">
                  Agent: <strong>{getAgentLabel(binding.agentId)}</strong>
                </span>
                <span className="block">
                  Kanal: <code className="rounded bg-muted px-1 text-xs">{binding.channel}</code>
                </span>
                <span className="block capitalize">Peer Türü: {binding.peerKind}</span>
                <span className="block">
                  Peer ID: {binding.peerId === null ? <em>ANY</em> : <code className="text-xs">{binding.peerId}</code>}
                </span>
              </span>
            )}
            <span className="mt-3 block">
              Bu işlem geri alınamaz. Routing kararları etkilenebilir.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Siliniyor…' : 'Sil'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
