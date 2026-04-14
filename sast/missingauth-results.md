# Missing Auth/Authz Analysis Results: ai-rag-super-admin

## Executive Summary
- Endpoints analyzed: 16
- Vulnerable: 0
- Likely Vulnerable: 12
- Not Vulnerable: 1
- Needs Manual Review: 2

**Critical context**: This is a **frontend-only SPA**. The frontend cannot enforce authorization — all real auth/authz enforcement must happen on the backend (`ai-rag-template`). The frontend `AuthGuard` and `isPlatformAdmin` check are UX conveniences only. Every "Likely Vulnerable" finding below indicates that the frontend sends no role/permission information to the backend beyond the JWT Bearer token. Whether these are actual vulnerabilities depends on whether the backend `/platform/*` endpoints verify `isPlatformAdmin` on the JWT. **A single dynamic test against the live API (calling any `/platform/*` endpoint with a regular user token) will confirm or dismiss all 12 findings at once.**

## Findings

### [LIKELY VULNERABLE] Client-side isPlatformAdmin check bypass
- **File**: `src/features/auth/components/login-form.tsx` (lines 35-37)
- **Endpoint**: Client-side check during login flow (affects access to entire dashboard)
- **Issue**: The `isPlatformAdmin` check is client-side only and trivially bypassable
- **Impact**: An attacker with valid non-admin credentials can bypass the login gate by calling the API directly or by manipulating localStorage, gaining access to the entire super-admin dashboard. If the backend does not enforce `isPlatformAdmin` on `/platform/*` endpoints, all admin operations are exposed.
- **Proof**:
  ```tsx
  // login-form.tsx line 35-37 — CLIENT-SIDE ONLY check
  if (data.user.isPlatformAdmin === false) {
    setError('Bu hesap platform admin yetkisine sahip değil.')
    return
  }
  ```
  The `useAuth()` hook does not verify `isPlatformAdmin`:
  ```ts
  const isAuthenticated = !!accessToken && !!user
  ```
- **Remediation**: 
  1. **Backend (critical)**: Ensure all `/platform/*` API endpoints verify server-side that the authenticated user has `isPlatformAdmin: true`.
  2. **Frontend (defense-in-depth)**: Add `isPlatformAdmin` verification to `AuthGuard`.
- **Dynamic Test**:
  ```
  # 1. Login as a regular (non-platform-admin) user via API
  curl -X POST https://api.edfu.ai/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"regular@company.com","password":"password123"}'
  
  # 2. Use the returned accessToken to call an admin endpoint
  curl -X GET https://api.edfu.ai/platform/companies \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
  
  # If 200 with data, the backend lacks role checks. If 403, backend is secure.
  ```

### [LIKELY VULNERABLE] AuthGuard — no role verification
- **File**: `src/components/layout/auth-guard.tsx` (lines 1-12)
- **Endpoint**: All protected React routes (`/`, `/companies`, `/companies/:id`, `/settings`, `/email-templates`, `/service-accounts`)
- **Issue**: AuthGuard checks only for the presence of a token and user in localStorage — no role, `isPlatformAdmin`, or permission verification
- **Impact**: Any authenticated user who sets localStorage values can access all super-admin pages. Combined with the client-side-only isPlatformAdmin check, the entire SPA route protection is bypassable.
- **Proof**:
  ```tsx
  export function AuthGuard() {
    const { isAuthenticated } = useAuth()
    // isAuthenticated = !!accessToken && !!user — no role check
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return <Outlet />
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/*` endpoints server-side.
  2. **Frontend (defense-in-depth)**: Enhance `AuthGuard` to verify `isPlatformAdmin === true` from the stored user object.
- **Dynamic Test**:
  ```
  # In browser DevTools console:
  localStorage.setItem('auth_access_token', '<REGULAR_USER_TOKEN>')
  localStorage.setItem('auth_refresh_token', '<REGULAR_USER_REFRESH_TOKEN>')
  localStorage.setItem('auth_user', JSON.stringify({
    id: 'regular-user', companyId: 'c1', role: 'member',
    isActive: true, email: 'user@test.com', name: 'Test',
    isPlatformAdmin: true  // Spoofed value
  }))
  # Navigate to / — AuthGuard passes. Observe if API calls succeed or return 403.
  ```

### [LIKELY VULNERABLE] Service Account password reveal
- **File**: `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 16-23)
- **Endpoint**: `GET /platform/service-accounts/:id/reveal`
- **Issue**: Decrypts and returns service account password in plaintext with no additional confirmation (no re-authentication, MFA, or admin password re-entry)
- **Impact**: If any authenticated user can call this endpoint without `isPlatformAdmin` enforcement, third-party service credentials are exposed. Even with proper role enforcement, a stolen admin JWT grants immediate access to all secrets.
- **Proof**:
  ```ts
  export function useRevealPassword(id: string) {
    return useMutation({
      mutationFn: async (): Promise<ServiceAccount> => {
        const { data } = await apiClient.get(`/platform/service-accounts/${id}/reveal`)
        return data
      },
    })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on `/platform/service-accounts/:id/reveal`.
  2. **Backend (recommended)**: Add step-up authentication (re-enter password or MFA) before revealing secrets.
  3. **Backend**: Implement audit logging for every reveal action.
- **Dynamic Test**:
  ```
  curl -X GET https://api.edfu.ai/platform/service-accounts/sa-1/reveal \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
  # If 200 with decryptedPassword, critical vulnerability. Expected: 403
  ```

### [LIKELY VULNERABLE] Service Account CRUD (create, update, delete)
- **File**: `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 25-61)
- **Endpoint**: `POST /platform/service-accounts`, `PATCH /platform/service-accounts/:id`, `DELETE /platform/service-accounts/:id`
- **Issue**: No client-side role check before creating, modifying, or deleting service account credentials
- **Impact**: If backend lacks role enforcement, any authenticated user can create malicious credentials, modify existing ones (credential tampering), or delete them (DoS for integrations).
- **Proof**:
  ```ts
  export function useCreateServiceAccount() {
    return useMutation({
      mutationFn: async (body: CreateServiceAccountRequest): Promise<ServiceAccount> => {
        const { data } = await apiClient.post('/platform/service-accounts', body)
        return data
      },
    })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/service-accounts/*` endpoints.
- **Dynamic Test**:
  ```
  curl -X POST https://api.edfu.ai/platform/service-accounts \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"serviceName":"test","email":"test@test.com","password":"test123"}'
  # If 201, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Platform defaults (read and update)
- **File**: `src/features/settings/hooks/use-platform-defaults.ts` (lines 1-27)
- **Endpoint**: `GET /platform/config/defaults`, `PUT /platform/config/defaults`
- **Issue**: Platform-wide default configuration (AI API keys, S3 credentials, SMTP settings, embedding config, Langfuse keys) modifiable with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can read all platform API keys/secrets and overwrite platform configuration — redirecting AI calls, changing S3 storage to attacker's bucket, modifying SMTP to intercept emails.
- **Proof**:
  ```ts
  export function useUpdatePlatformDefaults() {
    return useMutation({
      mutationFn: async (config: Record<string, unknown>) => {
        const { data } = await apiClient.put('/platform/config/defaults', config)
        return data
      },
    })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on both GET and PUT for `/platform/config/defaults`.
  2. **Backend (recommended)**: Require step-up auth for writing sensitive config.
- **Dynamic Test**:
  ```
  curl -X PUT https://api.edfu.ai/platform/config/defaults \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"aiConfig":{"apiKey":"attacker-key"}}'
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Company CRUD and status management
- **File**: `src/features/companies/hooks/use-companies.ts` (lines 1-27), `use-company.ts` (lines 1-43), `use-company-billing.ts` (lines 1-30)
- **Endpoint**: `GET/POST /platform/companies`, `GET/PATCH/DELETE /platform/companies/:id`, `PATCH /platform/companies/:id/status`
- **Issue**: Full company lifecycle management with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can list all companies (data leak), create/delete companies (catastrophic data loss), or suspend/cancel subscriptions (DoS).
- **Proof**:
  ```ts
  export function useDeleteCompany() {
    return useMutation({ mutationFn: async (id) => { await apiClient.delete(`/platform/companies/${id}`) } })
  }
  export function useUpdateCompanyStatus(companyId) {
    return useMutation({ mutationFn: async (status) => { ... apiClient.patch(`/platform/companies/${companyId}/status`, { status }) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/companies/*` endpoints.
- **Dynamic Test**:
  ```
  curl -X DELETE https://api.edfu.ai/platform/companies/<COMPANY_ID> \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Company user management (create, invite, update role, deactivate, bulk import)
- **File**: `src/features/companies/hooks/use-company-users.ts` (lines 1-83)
- **Endpoint**: `GET/POST /platform/companies/:id/users`, `POST .../users/invite`, `POST .../users/bulk-import`, `PATCH .../users/:userId`, `DELETE .../users/:userId`
- **Issue**: Full cross-company user management with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can list users across companies (PII exposure), create/delete users, escalate roles (member to owner), or bulk import users into any company.
- **Proof**:
  ```ts
  export function useUpdateUserRole(companyId) {
    return useMutation({
      mutationFn: async ({ userId, role }) => { ... apiClient.patch(`.../${companyId}/users/${userId}`, { role }) },
    })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/companies/:id/users/*` endpoints.
- **Dynamic Test**:
  ```
  curl -X POST https://api.edfu.ai/platform/companies/<COMPANY_ID>/users \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"email":"attacker@evil.com","name":"Attacker","password":"p","role":"owner"}'
  # If 201, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Pricing plan CRUD
- **File**: `src/features/companies/hooks/use-pricing-plans.ts` (lines 1-65)
- **Endpoint**: `GET/POST /platform/plans`, `GET/PATCH/DELETE /platform/plans/:id`
- **Issue**: Full pricing plan lifecycle management with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can create/modify/delete pricing plans, affecting billing for all companies.
- **Proof**:
  ```ts
  export function useCreatePricingPlan() {
    return useMutation({ mutationFn: async (body) => { ... apiClient.post('/platform/plans', body) } })
  }
  export function useDeletePricingPlan() {
    return useMutation({ mutationFn: async (id) => { ... apiClient.delete(`/platform/plans/${id}`) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/plans/*` write endpoints.
- **Dynamic Test**:
  ```
  curl -X POST https://api.edfu.ai/platform/plans \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Free","slug":"free","monthlyPriceTry":0,"includedUsers":999}'
  # If 201, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Company plan assignment and downgrade management
- **File**: `src/features/companies/hooks/use-company-plan.ts` (lines 1-33)
- **Endpoint**: `PUT /platform/companies/:id/plan`, `DELETE /platform/companies/:id/pending-plan`
- **Issue**: Plan assignment for any company with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can assign plans to any company (financial fraud) or cancel pending downgrades.
- **Proof**:
  ```ts
  export function useAssignCompanyPlan(companyId) {
    return useMutation({ mutationFn: async (planId) => { ... apiClient.put(`.../${companyId}/plan`, { planId }) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on plan assignment and downgrade cancellation endpoints.
- **Dynamic Test**:
  ```
  curl -X PUT https://api.edfu.ai/platform/companies/<COMPANY_ID>/plan \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"planId":"plan-enterprise"}'
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Email template management
- **File**: `src/features/email-templates/hooks/use-email-templates.ts` (lines 1-48)
- **Endpoint**: `GET /platform/email-templates`, `GET/PATCH /platform/email-templates/:slug`, `POST /platform/email-templates/:slug/preview`
- **Issue**: Email template modification with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can modify email templates to inject phishing links, redirect password reset emails to attacker sites, or inject malicious HTML.
- **Proof**:
  ```ts
  export function useUpdateEmailTemplate(slug) {
    return useMutation({ mutationFn: async (body) => { ... apiClient.patch(`.../${slug}`, body) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on all `/platform/email-templates/*` endpoints, especially PATCH.
  2. **Backend (recommended)**: Sanitize HTML content server-side.
- **Dynamic Test**:
  ```
  curl -X PATCH https://api.edfu.ai/platform/email-templates/welcome \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"bodyHtml":"<a href=\"https://evil.com\">Click</a>"}'
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Company config management
- **File**: `src/features/companies/hooks/use-company-config.ts` (lines 1-27)
- **Endpoint**: `GET/PUT /platform/companies/:id/config`
- **Issue**: Per-company configuration (AI keys, S3, SMTP, embedding, Langfuse, WhatsApp, data retention) modifiable with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can read/overwrite any company's configuration including API keys and secrets.
- **Proof**:
  ```ts
  export function useUpdateCompanyConfig(companyId) {
    return useMutation({ mutationFn: async (config) => { ... apiClient.put(`.../${companyId}/config`, config) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on both GET and PUT for `/platform/companies/:id/config`.
- **Dynamic Test**:
  ```
  curl -X PUT https://api.edfu.ai/platform/companies/<COMPANY_ID>/config \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"aiConfig":{"apiKey":"attacker-key"}}'
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Permanent lead deletion
- **File**: `src/features/companies/hooks/use-leads.ts` (lines 17-28)
- **Endpoint**: `DELETE /platform/companies/:companyId/leads/:leadId/permanent`
- **Issue**: Irreversible permanent deletion of lead data (GDPR-sensitive PII) with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can permanently destroy lead data from any company. Irreversible, GDPR-impacting, and could be used for sabotage.
- **Proof**:
  ```ts
  export function usePermanentDeleteLead(companyId) {
    return useMutation({ mutationFn: async (leadId) => { ... apiClient.delete(`.../${companyId}/leads/${leadId}/permanent`) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on permanent deletion endpoint.
  2. **Backend (recommended)**: Implement soft-delete with grace period; require re-authentication for permanent deletes.
- **Dynamic Test**:
  ```
  curl -X DELETE https://api.edfu.ai/platform/companies/<COMPANY_ID>/leads/<LEAD_ID>/permanent \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>"
  # If 202, backend lacks role enforcement. Expected: 403
  ```

### [LIKELY VULNERABLE] Tool plans management
- **File**: `src/features/companies/hooks/use-tool-plans.ts` (lines 1-27)
- **Endpoint**: `GET/PUT /platform/tool-plans`
- **Issue**: Tool plan configuration modifiable with no client-side role checks
- **Impact**: If backend lacks role enforcement, any authenticated user can enable expensive tools on free plans or disable tools on paid plans.
- **Proof**:
  ```ts
  export function useUpdateToolPlans() {
    return useMutation({ mutationFn: async (body) => { ... apiClient.put('/platform/tool-plans', body) } })
  }
  ```
- **Remediation**:
  1. **Backend (critical)**: Enforce `isPlatformAdmin` on PUT `/platform/tool-plans`.
- **Dynamic Test**:
  ```
  curl -X PUT https://api.edfu.ai/platform/tool-plans \
    -H "Authorization: Bearer <REGULAR_USER_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"defaultPlan":"all-tools","plans":{}}'
  # If 200, backend lacks role enforcement. Expected: 403
  ```

### [NEEDS MANUAL REVIEW] Axios interceptor — token attachment without role context
- **File**: `src/lib/api-client.ts` (lines 21-27)
- **Endpoint**: All API calls via `apiClient`
- **Uncertainty**: The Axios request interceptor attaches whatever token is in localStorage to every request with no client-side validation. This is standard SPA practice, but security depends entirely on backend JWT verification. Cannot determine from frontend code alone whether the backend properly validates JWT signature, expiry, and `isPlatformAdmin` claim.
- **Suggestion**: Verify on the backend that: (1) JWT signature is validated, (2) Token expiry is checked, (3) `isPlatformAdmin` is verified for `/platform/*` endpoints, (4) Revoked tokens are rejected.

### [NEEDS MANUAL REVIEW] Activity log integrity verification
- **File**: `src/mocks/handlers.ts` (lines 616-621) — mock handler present; no dedicated frontend hook found
- **Endpoint**: `POST /platform/companies/:id/activity-log/verify-integrity`
- **Uncertainty**: This endpoint verifies audit log integrity. While read-only, unauthorized access could reveal whether logs have been tampered with. No frontend hook was found, suggesting it may be called directly from a component or not yet implemented. Cannot determine backend auth enforcement from frontend code.
- **Suggestion**: Verify on the backend that this endpoint requires `isPlatformAdmin`. Search for direct `apiClient.post` calls to this endpoint in component files.

### [NOT VULNERABLE] MSW mock handlers — no auth validation (dev only)
- **File**: `src/mocks/handlers.ts` (lines 32-736)
- **Endpoint**: All mock API handlers
- **Protection**: MSW is active only in development mode. Mock handlers never run in production. The production build communicates directly with the real backend API. No production security impact.
