import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type { EmailTemplate, UpdateEmailTemplateRequest, EmailPreviewResponse } from '@/features/companies/types'

export function useEmailTemplates() {
  return useQuery({
    queryKey: queryKeys.platform.emailTemplates,
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data } = await apiClient.get('/platform/email-templates')
      return data
    },
  })
}

export function useEmailTemplate(slug: string) {
  return useQuery({
    queryKey: queryKeys.platform.emailTemplate(slug),
    queryFn: async (): Promise<EmailTemplate> => {
      const { data } = await apiClient.get(`/platform/email-templates/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}

export function useUpdateEmailTemplate(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateEmailTemplateRequest): Promise<EmailTemplate> => {
      const { data } = await apiClient.patch(`/platform/email-templates/${slug}`, body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.platform.emailTemplates })
      qc.invalidateQueries({ queryKey: queryKeys.platform.emailTemplate(slug) })
    },
  })
}

export function usePreviewEmailTemplate(slug: string) {
  return useMutation({
    mutationFn: async (variables: Record<string, string>): Promise<EmailPreviewResponse> => {
      const { data } = await apiClient.post(`/platform/email-templates/${slug}/preview`, { variables })
      return data
    },
  })
}
