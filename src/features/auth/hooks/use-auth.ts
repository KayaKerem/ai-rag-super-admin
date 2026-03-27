import { useState, useCallback } from 'react'
import type { User } from '../types'
import { apiClient } from '@/lib/api-client'

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_access_token')
  })

  const login = useCallback((newAccessToken: string, newRefreshToken: string, newUser: User) => {
    localStorage.setItem('auth_access_token', newAccessToken)
    localStorage.setItem('auth_refresh_token', newRefreshToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setAccessToken(newAccessToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    // Fire-and-forget: notify backend about logout
    apiClient.post('/auth/logout').catch(() => {})

    localStorage.removeItem('auth_access_token')
    localStorage.removeItem('auth_refresh_token')
    localStorage.removeItem('auth_user')
    setAccessToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!accessToken && !!user

  // `token` kept for backward compatibility
  return { user, token: accessToken, isAuthenticated, login, logout }
}
