export interface User {
  id: string
  companyId: string
  role: 'owner' | 'admin' | 'member'
  isActive: boolean
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  phoneNumber?: string | null
  expertiseAreas?: string[]
  isPlatformAdmin?: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}
