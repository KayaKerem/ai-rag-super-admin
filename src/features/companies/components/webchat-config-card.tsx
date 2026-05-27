import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUpdateCompany } from '../hooks/use-company'
import type { Company } from '../types'

interface WebChatConfigCardProps {
  company: Company
}

export function WebChatConfigCard({ company }: WebChatConfigCardProps) {
  const updateCompany = useUpdateCompany(company.id)
  const [brandColor, setBrandColor] = useState<string>(company.brandColor ?? '#000000')
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl ?? '')

  useEffect(() => {
    setBrandColor(company.brandColor ?? '#000000')
    setLogoUrl(company.logoUrl ?? '')
  }, [company.brandColor, company.logoUrl])

  const hasChanges =
    brandColor !== (company.brandColor ?? '#000000') ||
    logoUrl !== (company.logoUrl ?? '')

  function handleSave() {
    updateCompany.mutate(
      {
        brandColor: brandColor || null,
        logoUrl: logoUrl || null,
      },
      {
        onSuccess: () => toast.success('Kaydedildi'),
        onError: () => toast.error('Kaydedilemedi'),
      },
    )
  }

  function handleReset() {
    setBrandColor(company.brandColor ?? '#000000')
    setLogoUrl(company.logoUrl ?? '')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Marka ve Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brandColor">Marka Rengi</Label>
          <Input
            id="brandColor"
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-32"
          />
          <p className="text-xs text-muted-foreground">
            Widget bubble + header rengi (hex #RRGGBB). Backend yalnızca 6-hane hex kabul eder.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            https URL (max 500 karakter). Boş bırakırsanız logosuz görünür.
          </p>
        </div>

        {hasChanges && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Sıfırla
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
              {updateCompany.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
