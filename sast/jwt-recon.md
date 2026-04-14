# JWT Recon: ai-rag-super-admin

## Summary
JWT is **used** in this codebase, but only as an **opaque bearer token** — the frontend never decodes, verifies, or inspects JWT payloads. All JWT issuance and verification happens on the backend (`ai-rag-template`).

Library: **None** — no JWT library (jsonwebtoken, jwt-decode, jose, PyJWT, etc.) is present in `package.json` dependencies or imported anywhere in the source code.

Algorithm(s): Unknown (determined by backend)

## Issuance Sites

**No JWT issuance sites exist in this codebase.** Tokens are issued by the backend at `POST /auth/login` and `POST /auth/refresh`. The frontend receives them as opaque strings.

### 1. Token receipt from login endpoint
- **File**: `src/features/auth/hooks/use-login.ts` (lines 6-12) + `src/features/auth/components/login-form.tsx` (line 39)
- **Function / endpoint**: `useLogin()` mutation -> `POST /auth/login`
- **What happens**: Backend returns `{ accessToken, refreshToken, user }`. The frontend stores all three in `localStorage` via `useAuth().login()`.
- **Code snippet**:
  ```typescript
  // use-login.ts
  const response = await apiClient.post('/auth/login', data)
  return response.data

  // login-form.tsx
  login(data.accessToken, data.refreshToken, data.user)
  ```

### 2. Token receipt from refresh endpoint
- **File**: `src/lib/api-client.ts` (lines 54-65)
- **Function**: Axios response interceptor (401 handler)
- **What happens**: On 401, sends `POST /auth/refresh` with `refreshToken`. Stores new `accessToken`, `refreshToken`, and `user` in `localStorage`.
- **Code snippet**:
  ```typescript
  const { data } = await axios.post(
    `${import.meta.env.VITE_API_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  )
  localStorage.setItem('auth_access_token', data.accessToken)
  localStorage.setItem('auth_refresh_token', data.refreshToken)
  localStorage.setItem('auth_user', JSON.stringify(data.user))
  ```

## Verification Sites

**No JWT verification sites exist in this codebase.** The frontend never calls `jwt.decode()`, `jwt.verify()`, `jwtDecode()`, `atob()` on token parts, or any other JWT parsing function. Tokens are treated as opaque strings.

## Token Storage and Transmission

### Storage
- **Location**: `localStorage` (browser)
- **Keys**: `auth_access_token`, `auth_refresh_token`, `auth_user`
- **File**: `src/features/auth/hooks/use-auth.ts` (lines 14-19), `src/lib/api-client.ts` (lines 60-62)

### Transmission
- **Mechanism**: Axios request interceptor attaches `Authorization: Bearer <accessToken>` to every outgoing API request
- **File**: `src/lib/api-client.ts` (lines 21-27)
- **Code snippet**:
  ```typescript
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  ```

## Secret / Key Configuration
- **Not applicable** — no signing secret or key exists in this frontend codebase. All JWT signing/verification is handled by the backend.

## Authorization Middleware Coverage

### Client-side auth guard
- **File**: `src/components/layout/auth-guard.tsx`
- **Mechanism**: Checks if `accessToken` and `user` exist in `localStorage`. If not, redirects to `/login`.
- **Note**: This is a UX-only check (presence of token), not cryptographic verification. The real authorization is enforced by the backend via the Bearer token.

### Protected routes (client-side guard)
All routes except `/login` are wrapped by `AuthGuard` in `src/App.tsx`:
- `/` (Dashboard)
- `/companies`, `/companies/:id`
- `/settings`
- `/email-templates`
- `/service-accounts`

### Unprotected routes
- `/login`

### Additional client-side check
- **File**: `src/features/auth/components/login-form.tsx` (line 35)
- The login form checks `data.user.isPlatformAdmin === false` and blocks login with a UI error. This is a soft client-side check; the backend must enforce this as well.

## MSW Mock Layer (Development Only)
- **File**: `src/mocks/handlers.ts` (lines 34-84)
- Mock auth handlers return dummy tokens (`mock-access-token-<timestamp>`) without any real JWT structure or signing.
- The refresh handler accepts any `refreshToken` value and returns new mock tokens.
- This is dev-only and not a security concern for production.
