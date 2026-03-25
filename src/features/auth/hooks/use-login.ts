import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { LoginRequest, LoginResponse } from '../types'

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await apiClient.post('/auth/login', data)
      return response.data
    },
  })
}
