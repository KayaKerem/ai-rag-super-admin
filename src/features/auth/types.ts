export interface User {
  id: string
  email: string
  name: string
  isPlatformAdmin: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
