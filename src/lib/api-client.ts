import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Track whether a token refresh is already in progress to avoid concurrent refreshes
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if the failing request was itself the refresh call
      if (originalRequest.url === '/auth/refresh') {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const refreshToken = localStorage.getItem('auth_refresh_token')

        if (!refreshToken) {
          clearAuthAndRedirect()
          return Promise.reject(error)
        }

        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          )

          localStorage.setItem('auth_access_token', data.accessToken)
          localStorage.setItem('auth_refresh_token', data.refreshToken)
          localStorage.setItem('auth_user', JSON.stringify(data.user))

          isRefreshing = false
          onTokenRefreshed(data.accessToken)

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
          return apiClient(originalRequest)
        } catch {
          isRefreshing = false
          refreshSubscribers = []
          clearAuthAndRedirect()
          return Promise.reject(error)
        }
      }

      // Another refresh is already in progress — queue this request
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    return Promise.reject(error)
  }
)

function clearAuthAndRedirect() {
  localStorage.removeItem('auth_access_token')
  localStorage.removeItem('auth_refresh_token')
  localStorage.removeItem('auth_user')
  window.location.href = '/login'
}
