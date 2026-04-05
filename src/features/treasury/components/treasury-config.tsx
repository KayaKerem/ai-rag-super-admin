import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field-label'
import { useTreasuryConfig, useUpdateTreasuryConfig } from '../hooks/use-treasury'
import type { TreasuryConfig as TreasuryConfigType } from '../types'

interface FieldDef {
  key: keyof TreasuryConfigType
  label: string
  hint: string
}

const sections: Array<{ title: string; description: string; fields: FieldDef[] }> = [
  {
    title: 'Tampon & Esikler',
    description: 'Likit bakiye ve stake/unstake tetikleme esikleri',
    fields: [
      { key: 'bufferDays', label: 'Tampon Gun', hint: 'Likit tutulacak minimum gun sayisi (7-365)' },
      { key: 'stakeThreshold', label: 'Stake Esigi', hint: 'Likit/ihtiyac orani bu degeri asinca stake oner (>1.0)' },
      { key: 'unstakeThreshold', label: 'Unstake Esigi', hint: 'Likit/ihtiyac orani bu degerin altina dusunce unstake oner (0.01-0.99)' },
    ],
  },
  {
    title: 'DeFi Oranlari',
    description: 'Stake edilecek miktarin protokollere dagilim yuzdeleri',
    fields: [
      { key: 'aaveRatio', label: 'Aave Orani', hint: 'Stake edilecek miktarin Aave\'ye gidecek yuzdesi' },
      { key: 'benqiRatio', label: 'BENQI Orani', hint: 'Stake edilecek miktarin BENQI\'ye gidecek yuzdesi' },
    ],
  },
  {
    title: 'OpenRouter Uyarilari',
    description: 'OpenRouter bakiye uyari esikleri',
    fields: [
      { key: 'orWarningDays', label: 'Uyari Gunu', hint: 'OpenRouter runway bu gunun altina dusunce WARNING' },
      { key: 'orCriticalDays', label: 'Kritik Gun', hint: 'OpenRouter runway bu gunun altina dusunce CRITICAL' },
    ],
  },
  {
    title: 'Aksiyon Limitleri',
    description: 'Otomatik aksiyon limitleri ve kontroller',
    fields: [
      { key: 'minStakeUsdc', label: 'Min Stake (USDC)', hint: 'Minimum stake miktari' },
      { key: 'minUnstakeUsdc', label: 'Min Unstake (USDC)', hint: 'Minimum unstake miktari' },
      { key: 'maxActionPct', label: 'Maks Aksiyon %', hint: 'Tek aksiyonda harcanabilecek toplam treasury yuzdesi (0.01-0.80)' },
      { key: 'deficitConsecutiveChecks', label: 'Ardisik Kontrol', hint: 'Unstake tetiklenmesi icin kac ardisik kontrol gerekli (1-10)' },
    ],
  },
]

export function TreasuryConfigComponent() {
  const { data: config, isLoading } = useTreasuryConfig()
  const updateMutation = useUpdateTreasuryConfig()
  const [formValues, setFormValues] = useState<Record<string, number>>({})

  useEffect(() => {
    if (config) {
      const vals: Record<string, number> = {}
      for (const section of sections) {
        for (const field of section.fields) {
          vals[field.key] = config[field.key] as number
        }
      }
      setFormValues(vals)
    }
  }, [config])

  function handleSave() {
    updateMutation.mutate(formValues as Partial<TreasuryConfigType>, {
      onSuccess: () => toast.success('Treasury ayarlari kaydedildi'),
      onError: () => toast.error('Kaydetme basarisiz oldu'),
    })
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yukleniyor...</div>
  if (!config) return <div className="text-sm text-muted-foreground">Config bulunamadi.</div>

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
            <CardDescription className="text-xs">{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <FieldLabel label={field.label} hint={field.hint} />
                  <Input
                    type="number"
                    step="any"
                    value={formValues[field.key] ?? ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        [field.key]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </div>
  )
}
