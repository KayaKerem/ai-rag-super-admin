import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { RevealResponse } from '@/features/companies/types'

export function useRevealPassword() {
  return useMutation({
    mutationFn: async (id: string): Promise<RevealResponse> => {
      const { data } = await apiClient.get<RevealResponse>(`/platform/service-accounts/${id}/reveal`)
      return data
    },
    onError: (err: any) => {
      if (err?.response?.status === 429) {
        const retryAfter = Number(err.response.headers?.['retry-after']) || 30
        toast.error(`Çok sık deneme. ${retryAfter}s sonra tekrar.`)
        return
      }
      toast.error('Şifre gösterilemedi')
    },
  })
}
