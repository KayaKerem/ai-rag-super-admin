import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useCreateAgentRouteBinding } from '../hooks/use-agent-route-bindings'
import { parseRouteBindingError } from '../lib/parse-error'
import {
  routeBindingFormSchema,
  type RouteBindingFormValues,
} from '../lib/form-schema'
import {
  AGENT_IDS,
  AGENT_OPTIONS,
  KNOWN_CHANNELS,
  PEER_KIND_OPTIONS,
  getAgentLabel,
  isKnownChannel,
  normalizePeerId,
  type AgentRouteBinding,
  type KnownChannel,
} from '../types'
import { RolesChipInput } from './roles-chip-input'

interface AgentRouteBindingDialogProps {
  binding: AgentRouteBinding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function makeDefaults(binding: AgentRouteBinding | null): RouteBindingFormValues {
  if (binding) {
    return {
      agentId: binding.agentId as RouteBindingFormValues['agentId'],
      channel: binding.channel,
      peerKind: binding.peerKind,
      peerId: binding.peerId,
      roles: binding.roles,
      priority: binding.priority,
      notes: binding.notes,
    }
  }
  return {
    agentId: AGENT_IDS[0],
    channel: '',
    peerKind: 'customer',
    peerId: '',
    roles: [],
    priority: 0,
    notes: '',
  }
}

export function AgentRouteBindingDialog({
  binding,
  open,
  onOpenChange,
}: AgentRouteBindingDialogProps) {
  const isEdit = binding !== null
  const createMutation = useCreateAgentRouteBinding()

  const form = useForm<RouteBindingFormValues>({
    resolver: zodResolver(routeBindingFormSchema),
    defaultValues: makeDefaults(binding),
  })

  const [channelMode, setChannelMode] = useState<'known' | 'custom'>(
    binding && !isKnownChannel(binding.channel) ? 'custom' : 'known'
  )

  useEffect(() => {
    if (open) {
      form.reset(makeDefaults(binding))
      setChannelMode(binding && !isKnownChannel(binding.channel) ? 'custom' : 'known')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binding, open])

  function onSubmit(values: RouteBindingFormValues) {
    const peerIdNorm = normalizePeerId(values.peerId ?? '')
    const notesNorm =
      (values.notes ?? '').trim() === '' ? null : (values.notes ?? '').trim()

    if (isEdit) {
      // Edit handler wired in PR 4. Should not be reached in PR 3.
      toast.error('Edit henüz aktif değil (PR 4)')
      return
    }

    createMutation.mutate(
      {
        agentId: values.agentId,
        channel: values.channel,
        peerKind: values.peerKind,
        peerId: peerIdNorm,
        roles: values.roles,
        priority: values.priority,
        notes: notesNorm,
      },
      {
        onSuccess: () => {
          toast.success('Binding oluşturuldu')
          onOpenChange(false)
        },
        onError: (err) => {
          const parsed = parseRouteBindingError(err)
          if (parsed.status === 409 && parsed.code === 'binding_duplicate') {
            const ctx = parsed.conflict
            if (ctx) {
              toast.error(
                `Aynı kombinasyon mevcut: ${getAgentLabel(ctx.agentId)} · ${ctx.channel} · ${ctx.peerKind}${ctx.peerId ? `:${ctx.peerId}` : ''} · öncelik ${ctx.priority}`
              )
            } else {
              toast.error('Aynı kombinasyon mevcut: (agentId, channel, peerKind, peerId, priority) eşsiz olmalı.')
            }
            return
          }
          if (parsed.status === 400 && parsed.code === 'invalid_agent_id') {
            toast.error('Geçersiz agent ID — agent veritabanında bulunamadı.')
            return
          }
          toast.error('Oluşturma başarısız')
        },
      }
    )
  }

  const isPending = createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Binding Düzenle' : 'Yeni Binding'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Agent */}
          <div>
            <Label htmlFor="agentId">Agent *</Label>
            <Select
              value={form.watch('agentId')}
              onValueChange={(v) =>
                form.setValue('agentId', v as RouteBindingFormValues['agentId'], { shouldValidate: true })
              }
            >
              <SelectTrigger id="agentId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_OPTIONS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.agentId && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.agentId.message}
              </p>
            )}
          </div>

          {/* Channel mode + value */}
          <div>
            <div className="mb-2 flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={channelMode === 'known'}
                  onChange={() => setChannelMode('known')}
                />
                Bilinen
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={channelMode === 'custom'}
                  onChange={() => setChannelMode('custom')}
                />
                Diğer
              </label>
            </div>
            <Label htmlFor="channel">Kanal *</Label>
            {channelMode === 'known' ? (
              <Select
                value={isKnownChannel(form.watch('channel')) ? form.watch('channel') : ''}
                onValueChange={(v) =>
                  form.setValue('channel', v as KnownChannel, { shouldValidate: true })
                }
              >
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue placeholder="Kanal seçin" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="channel"
                {...form.register('channel')}
                placeholder="örn: instagram-bot"
                maxLength={50}
              />
            )}
            {form.formState.errors.channel && (
              <p className="mt-1 text-xs text-destructive">
                {form.formState.errors.channel.message}
              </p>
            )}
          </div>

          {/* Peer Kind + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="peerKind">Peer Türü *</Label>
              <Select
                value={form.watch('peerKind')}
                onValueChange={(v) =>
                  form.setValue('peerKind', v as RouteBindingFormValues['peerKind'], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="peerKind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PEER_KIND_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Öncelik (0-1000)</Label>
              <Input
                id="priority"
                type="number"
                min={0}
                max={1000}
                {...form.register('priority', { valueAsNumber: true })}
              />
              {form.formState.errors.priority && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.priority.message}
                </p>
              )}
            </div>
          </div>

          {/* Peer ID */}
          <div>
            <Label htmlFor="peerId">Peer ID</Label>
            <Input
              id="peerId"
              value={form.watch('peerId') ?? ''}
              onChange={(e) => form.setValue('peerId', e.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Boş bırakılırsa tüm peer'lara uygulanır (wildcard).
            </p>
          </div>

          {/* Roles */}
          <div>
            <Label>Roller</Label>
            <RolesChipInput
              value={form.watch('roles')}
              onChange={(next) => form.setValue('roles', next, { shouldValidate: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Boş bırakılırsa her rol geçer. Max 10.
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notlar (opsiyonel)</Label>
            <textarea
              id="notes"
              className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              value={form.watch('notes') ?? ''}
              onChange={(e) => form.setValue('notes', e.target.value)}
              maxLength={1000}
              placeholder="Operator memo (max 1000 karakter)"
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
