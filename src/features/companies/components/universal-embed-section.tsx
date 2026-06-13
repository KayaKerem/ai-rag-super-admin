import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useWpPluginVersion } from '../hooks/use-wp-plugin-version'

interface UniversalEmbedSectionProps {
  slug: string
}

function buildSnippets(scriptUrl: string) {
  return {
    html: `<script src="${scriptUrl}"></script>`,
    next: `import Script from 'next/script';

<Script src="${scriptUrl}" strategy="afterInteractive" />`,
    vue: `<script setup>
import { onMounted } from 'vue';
onMounted(() => {
  const s = document.createElement('script');
  s.src = '${scriptUrl}';
  document.body.appendChild(s);
});
</script>`,
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Kopyalandı')
  } catch {
    toast.error('Kopyalama başarısız — manuel seç')
  }
}

export function UniversalEmbedSection({ slug }: UniversalEmbedSectionProps) {
  const { data } = useWpPluginVersion()

  const scriptUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
    // embedScriptUrlTemplate relatif path döner — host'u FE ekler (26-wp-plugin.md §2)
    return data?.embedScriptUrlTemplate
      ? `${base}${data.embedScriptUrlTemplate.replace('{slug}', slug)}`
      : `${base}/public/wp-plugin/by-slug/${slug}/edfu-chat.js`
  }, [data?.embedScriptUrlTemplate, slug])

  const snippets = useMemo(() => buildSnippets(scriptUrl), [scriptUrl])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Universal Embed</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          WordPress dışındaki siteler için tek satır embed.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="next">Next.js</TabsTrigger>
            <TabsTrigger value="vue">Vue</TabsTrigger>
          </TabsList>

          {(['html', 'next', 'vue'] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-3">
              <div className="relative">
                <pre className="bg-muted rounded p-3 text-xs overflow-x-auto">
                  <code>{snippets[key]}</code>
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(snippets[key])}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Kopyala
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
