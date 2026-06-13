import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

// version.json şeması: docs/frontend-admin/26-wp-plugin.md §2.
// URL template'leri RELATİF path içerir — host'u FE compose eder.
export interface WpPluginVersion {
  latest: string
  minBackend: string
  available: boolean
  downloadUrlTemplate: string
  embedScriptUrlTemplate: string
  notes?: string
}

export function useWpPluginVersion() {
  return useQuery({
    queryKey: queryKeys.public.wpPluginVersion,
    queryFn: async (): Promise<WpPluginVersion> => {
      const base = import.meta.env.VITE_API_URL || 'https://api.edfu.ai'
      const res = await fetch(`${base}/public/wp-plugin/version.json`)
      if (!res.ok) throw new Error(`version.json fetch failed: ${res.status}`)
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
