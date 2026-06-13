import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWpPluginVersion } from '../hooks/use-wp-plugin-version'

interface WpPluginSectionProps {
  slug: string
}

export function WpPluginSection({ slug }: WpPluginSectionProps) {
  const { data, isLoading } = useWpPluginVersion()

  const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
  // downloadUrlTemplate relatif path döner — host'u FE ekler (26-wp-plugin.md §2)
  const zipUrl = data?.downloadUrlTemplate
    ? `${base}${data.downloadUrlTemplate.replace('{slug}', slug)}`
    : `${base}/public/wp-plugin/by-slug/${slug}/edfu-chat.zip`

  const isAvailable = data?.available ?? true

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">WordPress Plugin</CardTitle>
        {data && (
          <Badge variant="outline" className="text-xs">
            v{data.latest} (backend {data.minBackend}+)
          </Badge>
        )}
        {!data && !isLoading && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Plugin version bilgisi alınamadı
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {isAvailable ? (
            <a
              href={zipUrl}
              download
              className={cn(buttonVariants({ variant: 'default' }))}
            >
              <Download className="h-4 w-4 mr-2" />
              .zip indir
            </a>
          ) : (
            <>
              <span
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'pointer-events-none opacity-50',
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                .zip indir
              </span>
              <p className="text-xs text-muted-foreground mt-2">
                Şu an indirilebilir değil.
              </p>
            </>
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Kurulum:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>WP admin {`>`} Plugins {`>`} Add New {`>`} Upload Plugin</li>
            <li>İndirdiğin <code>edfu-chat-{slug}.zip</code> dosyasını seç</li>
            <li>Install Now → Activate</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
