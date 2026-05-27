import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export interface WpPluginVersion {
  version: string
  tested_up_to: string
  requires_at_least: string
  downloadUrlTemplate: string
  embedScriptUrlTemplate: string
  available: boolean
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
