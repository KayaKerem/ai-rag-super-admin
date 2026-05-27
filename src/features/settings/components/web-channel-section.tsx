import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'

export function WebChannelSection() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">WebChat Embed Kill-Switch</CardTitle>
          <Badge variant="outline" className="text-xs">ENV-managed</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                <code>WEBCHAT_EMBED_ENABLED</code> ortam değişkeni Coolify env panelinden yönetilir.
                Değer <code>false</code> ya da <code>0</code> ise embed-mode mesajlaşma 503 döner;
                cookie-mode WebChat çalışmaya devam eder.
              </p>
              <p>
                Statü göstergesi için backend admin endpoint&apos;i henüz yok — Sprint B follow-up.
                Mevcut değer Coolify env panelinde görüntülenir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">İlgili Dokümantasyon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Per-tenant WebChat config: Şirket detay → WebChat sekmesi</p>
          <p>• Visitor verify-fail stats: Sprint B17 follow-up</p>
        </CardContent>
      </Card>
    </div>
  )
}
