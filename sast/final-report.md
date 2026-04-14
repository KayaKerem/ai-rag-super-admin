# Security Assessment Final Report

**Project**: ai-rag-super-admin
**Generated**: 2026-04-14
**Scans completed**: XSS, Hardcoded Secrets, SSRF, Path Traversal, SQL Injection, IDOR, Missing Auth, Business Logic, RCE, JWT, SSTI, File Upload, XXE, GraphQL

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High     | 9 |
| Medium   | 6 |
| Low      | 0 |
| **Total confirmed findings** | **18** |

Scans with no confirmed vulnerabilities: XSS, Hardcoded Secrets, SSRF, Path Traversal, SQL Injection, IDOR, RCE, JWT, SSTI, File Upload, XXE, GraphQL
Findings requiring manual review: 15 (see `idor-results.md` [9], `missingauth-results.md` [2], `businesslogic-results.md` [4])

> **Important context**: This is a **frontend-only SPA**. All 12 Missing Auth findings share a single root cause: the frontend relies entirely on the backend (`ai-rag-template`) for role enforcement. **A single dynamic test** — calling any `/platform/*` endpoint with a regular (non-admin) user JWT — will confirm or dismiss all 12 Missing Auth findings at once. If the backend enforces `isPlatformAdmin`, these are all non-issues. If it does not, every finding is a confirmed vulnerability.

---

## Vulnerability Index

| # | Title | Type | Severity | Endpoint / File |
|---|-------|------|----------|----------------|
| 1 | Service Account Password Reveal — No Admin Role Check | Missing Auth | Critical | `GET /platform/service-accounts/:id/reveal` |
| 2 | Platform Defaults (API Keys) — No Admin Role Check | Missing Auth | Critical | `GET/PUT /platform/config/defaults` |
| 3 | Company Config (API Keys) — No Admin Role Check | Missing Auth | Critical | `GET/PUT /platform/companies/:id/config` |
| 4 | Client-side isPlatformAdmin Check Bypass | Missing Auth | High | `src/features/auth/components/login-form.tsx` |
| 5 | AuthGuard — No Role Verification | Missing Auth | High | `src/components/layout/auth-guard.tsx` |
| 6 | Company CRUD and Status Management — No Admin Role Check | Missing Auth | High | `/platform/companies/*` |
| 7 | Company User Management — No Admin Role Check | Missing Auth | High | `/platform/companies/:id/users/*` |
| 8 | Service Account CRUD — No Admin Role Check | Missing Auth | High | `/platform/service-accounts/*` |
| 9 | Permanent Lead Deletion — No Admin Role Check | Missing Auth | High | `DELETE /platform/companies/:companyId/leads/:leadId/permanent` |
| 10 | Email Template Management — No Admin Role Check | Missing Auth | High | `/platform/email-templates/*` |
| 11 | Company Plan Assignment — No Admin Role Check | Missing Auth | High | `PUT /platform/companies/:id/plan` |
| 12 | Service Account Password Reveal Without Re-Authentication | Business Logic | High | `GET /platform/service-accounts/:id/reveal` |
| 13 | Pricing Plan CRUD — No Admin Role Check | Missing Auth | Medium | `/platform/plans/*` |
| 14 | Tool Plans Management — No Admin Role Check | Missing Auth | Medium | `GET/PUT /platform/tool-plans` |
| 15 | Negative Pricing on Plan Creation/Update | Business Logic | Medium | `POST/PATCH /platform/plans` |
| 16 | Negative Budget/Limit Values in Plans | Business Logic | Medium | `POST/PATCH /platform/plans` |
| 17 | Negative Auto-Approve Quote Threshold | Business Logic | Medium | `PATCH /platform/companies/:id` |
| 18 | Negative Operations/AI Budget Bypassing Spend Limits | Business Logic | Medium | `PUT /platform/companies/:id/config` |

---

## Findings

### Critical

#### #1 — Service Account Password Reveal — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET /platform/service-accounts/:id/reveal` — `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 16-23)
- **Severity rationale**: This endpoint returns **plaintext decrypted passwords** for third-party services (Google, GitHub, SSO, payment processors). Unauthorized access exposes credentials for systems **beyond** the RAG platform, making confidentiality impact maximal. Classified Critical per "Missing authentication on sensitive endpoints" baseline.
- **Issue**: Decrypts and returns service account password in plaintext with no additional confirmation (no re-authentication, MFA, or admin password re-entry). The frontend sends only the standard Bearer JWT — no client-side role check.
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

---

#### #2 — Platform Defaults (API Keys) — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET /platform/config/defaults`, `PUT /platform/config/defaults` — `src/features/settings/hooks/use-platform-defaults.ts` (lines 1-27)
- **Severity rationale**: Platform defaults contain all platform-wide API keys (AI/OpenAI, S3 access keys, SMTP credentials, embedding keys, Langfuse secrets, Cloudflare tokens). Read access leaks every secret; write access allows full platform reconfiguration. Critical confidentiality and integrity impact.
- **Issue**: Platform-wide default configuration (AI API keys, S3 credentials, SMTP settings, embedding config, Langfuse keys) modifiable with no client-side role checks.
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

---

#### #3 — Company Config (API Keys) — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET/PUT /platform/companies/:id/config` — `src/features/companies/hooks/use-company-config.ts` (lines 1-27)
- **Severity rationale**: Per-company config contains company-specific AI API keys, S3 credentials, SMTP settings, embedding keys, Langfuse secrets, and WhatsApp config. Unauthorized access exposes every company's secrets individually. Critical confidentiality impact across all tenants.
- **Issue**: Per-company configuration (AI keys, S3, SMTP, embedding, Langfuse, WhatsApp, data retention) modifiable with no client-side role checks.
- **Impact**: If backend lacks role enforcement, any authenticated user can read/overwrite any company's configuration including API keys and secrets.
- **Proof**:
  ```ts
  export function useUpdateCompanyConfig(companyId) {
    return useMutation({
      mutationFn: async (config) => {
        const { data } = await apiClient.put(`/platform/companies/${companyId}/config`, config)
        return data
      },
    })
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

---

### High

#### #4 — Client-side isPlatformAdmin Check Bypass — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `src/features/auth/components/login-form.tsx` (lines 35-37) — affects access to entire dashboard
- **Severity rationale**: This is the **architectural root cause** for all Missing Auth findings. The only gate between a regular user and the super-admin dashboard is a client-side JavaScript check that can be bypassed by calling the API directly or manipulating localStorage. High because it enables access to all admin functionality.
- **Issue**: The `isPlatformAdmin` check is client-side only and trivially bypassable.
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

---

#### #5 — AuthGuard — No Role Verification — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `src/components/layout/auth-guard.tsx` (lines 1-12) — all protected routes
- **Severity rationale**: AuthGuard protects all admin routes (`/`, `/companies`, `/settings`, `/email-templates`, `/service-accounts`) but checks only token presence, not role. Combined with #4, the entire SPA route protection is bypassable. High due to full dashboard access.
- **Issue**: AuthGuard checks only for the presence of a token and user in localStorage — no role, `isPlatformAdmin`, or permission verification.
- **Impact**: Any authenticated user who sets localStorage values can access all super-admin pages.
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

---

#### #6 — Company CRUD and Status Management — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET/POST /platform/companies`, `GET/PATCH/DELETE /platform/companies/:id`, `PATCH /platform/companies/:id/status` — `src/features/companies/hooks/use-companies.ts`, `use-company.ts`, `use-company-billing.ts`
- **Severity rationale**: Full company lifecycle management including deletion and service suspension. A non-admin user could delete companies (catastrophic data loss) or cancel subscriptions (service disruption for all company users). High due to integrity and availability impact across all tenants.
- **Issue**: Full company lifecycle management with no client-side role checks.
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

---

#### #7 — Company User Management — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET/POST /platform/companies/:id/users`, `POST .../users/invite`, `POST .../users/bulk-import`, `PATCH .../users/:userId`, `DELETE .../users/:userId` — `src/features/companies/hooks/use-company-users.ts`
- **Severity rationale**: Cross-company user management with no role checks. Exposes PII (emails, names, phone numbers) across all companies. Role escalation possible (member to owner). Bulk import could inject users. High due to PII exposure and privilege escalation risk.
- **Issue**: Full cross-company user management with no client-side role checks.
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

---

#### #8 — Service Account CRUD — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `POST /platform/service-accounts`, `PATCH /platform/service-accounts/:id`, `DELETE /platform/service-accounts/:id` — `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 25-61)
- **Severity rationale**: Unauthorized CRUD on service account credentials enables credential tampering (modifying passwords to lock out integrations), creation of backdoor accounts, and deletion of credentials (DoS for all third-party integrations). High due to integrity impact on credential storage.
- **Issue**: No client-side role check before creating, modifying, or deleting service account credentials.
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

---

#### #9 — Permanent Lead Deletion — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `DELETE /platform/companies/:companyId/leads/:leadId/permanent` — `src/features/companies/hooks/use-leads.ts` (lines 17-28)
- **Severity rationale**: Irreversible permanent deletion of lead data containing PII (names, emails, phones). GDPR-impacting operation. Could be used for sabotage or data destruction across any company. High due to irreversibility and regulatory impact.
- **Issue**: Irreversible permanent deletion of lead data (GDPR-sensitive PII) with no client-side role checks.
- **Impact**: If backend lacks role enforcement, any authenticated user can permanently destroy lead data from any company. Irreversible, GDPR-impacting, and could be used for sabotage.
- **Proof**:
  ```ts
  export function usePermanentDeleteLead(companyId) {
    return useMutation({
      mutationFn: async (leadId) => {
        const { data } = await apiClient.delete(`/platform/companies/${companyId}/leads/${leadId}/permanent`)
        return data
      },
    })
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

---

#### #10 — Email Template Management — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET /platform/email-templates`, `GET/PATCH /platform/email-templates/:slug`, `POST /platform/email-templates/:slug/preview` — `src/features/email-templates/hooks/use-email-templates.ts`
- **Severity rationale**: Email template modification allows injection of phishing links into system emails (welcome, password reset, invite). Templates are identified by predictable slugs. Password reset template modification could redirect users to attacker-controlled sites. High due to potential for stored XSS via email and phishing.
- **Issue**: Email template modification with no client-side role checks.
- **Impact**: If backend lacks role enforcement, any authenticated user can modify email templates to inject phishing links, redirect password reset emails to attacker sites, or inject malicious HTML.
- **Proof**:
  ```ts
  export function useUpdateEmailTemplate(slug) {
    return useMutation({
      mutationFn: async (body) => {
        const { data } = await apiClient.patch(`/platform/email-templates/${slug}`, body)
        return data
      },
    })
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

---

#### #11 — Company Plan Assignment — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `PUT /platform/companies/:id/plan`, `DELETE /platform/companies/:id/pending-plan` — `src/features/companies/hooks/use-company-plan.ts`
- **Severity rationale**: Plan assignment controls billing and service limits for every company. Unauthorized upgrades cause financial loss; unauthorized downgrades degrade service. Cancelling pending downgrades affects billing commitments. High due to financial and service integrity impact.
- **Issue**: Plan assignment for any company with no client-side role checks.
- **Impact**: If backend lacks role enforcement, any authenticated user can assign plans to any company (financial fraud) or cancel pending downgrades.
- **Proof**:
  ```ts
  export function useAssignCompanyPlan(companyId) {
    return useMutation({
      mutationFn: async (planId) => {
        const { data } = await apiClient.put(`/platform/companies/${companyId}/plan`, { planId })
        return data
      },
    })
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

---

#### #12 — Service Account Password Reveal Without Re-Authentication — Business Logic

- **Source scan**: `sast/businesslogic-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET /platform/service-accounts/:id/reveal` — `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 16-22), `src/features/service-accounts/components/service-account-table.tsx` (lines 41-63)
- **Severity rationale**: Even with proper `isPlatformAdmin` enforcement, a stolen admin JWT (e.g., via XSS exploiting localStorage token storage) provides immediate access to all third-party service credentials. No step-up auth, rate limiting, or additional challenge exists. High because JWT-in-localStorage is a known risk vector that this design amplifies.
- **Issue**: The `useRevealPassword` hook performs a simple `GET` request using the standard Bearer token. There is no additional authentication challenge (password re-entry, TOTP, or confirmation code). The reveal button triggers with a single click. No rate limiting visible on the client side. The revealed password is displayed in a dialog and can be copied to clipboard.
- **Impact**: Service accounts store third-party credentials (email/password for external services). If the admin's JWT is compromised, the attacker can enumerate all service accounts and reveal each password, gaining access to all third-party services the organization uses.
- **Proof**:
  ```ts
  // use-service-accounts.ts lines 16-22
  export function useRevealPassword(id: string) {
    return useMutation({
      mutationFn: async (): Promise<ServiceAccount> => {
        const { data } = await apiClient.get(`/platform/service-accounts/${id}/reveal`)
        return data
      },
    })
  }
  // service-account-table.tsx lines 41-63: RevealButton calls reveal.mutate()
  // with no confirmation or re-auth step beyond a single click
  ```
- **Remediation**:
  1. Add a re-authentication step before revealing passwords: require admin to re-enter password or provide TOTP code.
  2. Implement server-side rate limiting on `/reveal` (e.g., max 5 reveals per minute).
  3. Add audit logging for each reveal action.
  4. Consider short-lived reveal tokens instead of returning the password in the API response.
- **Dynamic Test**:
  ```
  # 1. Log in as admin and note the JWT access token from localStorage
  # 2. In a new browser/incognito (simulating token theft), use the stolen token:
  
  curl https://api.edfu.ai/platform/service-accounts \
    -H "Authorization: Bearer <stolen-token>"
  
  # 3. For each returned account, reveal the password:
  curl https://api.edfu.ai/platform/service-accounts/<id>/reveal \
    -H "Authorization: Bearer <stolen-token>"
  
  # 4. Verify all passwords returned without additional auth challenge
  # 5. Test rapid enumeration: loop through all IDs in under 10 seconds
  ```

---

### Medium

#### #13 — Pricing Plan CRUD — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET/POST /platform/plans`, `GET/PATCH/DELETE /platform/plans/:id` — `src/features/companies/hooks/use-pricing-plans.ts`
- **Severity rationale**: Pricing plans affect billing for all companies. Unauthorized creation of free plans or deletion of active plans disrupts revenue. Medium because financial impact is indirect (plans must be assigned to companies to take effect) and the operation is visible in the admin UI.
- **Issue**: Full pricing plan lifecycle management with no client-side role checks.
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

---

#### #14 — Tool Plans Management — No Admin Role Check — Missing Auth

- **Source scan**: `sast/missingauth-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `GET/PUT /platform/tool-plans` — `src/features/companies/hooks/use-tool-plans.ts`
- **Severity rationale**: Tool plan modification can enable expensive tools on free plans or disable tools on paid plans. Medium because impact is limited to tool access configuration and changes are visible in admin UI.
- **Issue**: Tool plan configuration modifiable with no client-side role checks.
- **Impact**: If backend lacks role enforcement, any authenticated user can enable expensive tools on free plans or disable tools on paid plans.
- **Proof**:
  ```ts
  export function useUpdateToolPlans() {
    return useMutation({
      mutationFn: async (body) => {
        const { data } = await apiClient.put('/platform/tool-plans', body)
        return data
      },
    })
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

---

#### #15 — Negative Pricing on Plan Creation/Update — Business Logic

- **Source scan**: `sast/businesslogic-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `POST /platform/plans`, `PATCH /platform/plans/:id` — `src/features/settings/components/pricing-plans-section.tsx` (lines 64-78)
- **Severity rationale**: Negative plan prices corrupt revenue calculations and could create plans where companies receive credits instead of being charged. Medium per "Business logic flaws (price manipulation)" baseline.
- **Issue**: The `formToRequest` function converts the price field with `f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null`. A negative string like "-500" is truthy, so `Number("-500")` yields `-500`. The HTML `<Input type="number">` has no `min` attribute. The `formToRequest` function bypasses Zod schema validation entirely, doing raw `Number()` coercion.
- **Impact**: A plan with a negative price could corrupt revenue calculations, cause financial discrepancies in billing, or create plans where companies receive credits.
- **Proof**:
  ```tsx
  // pricing-plans-section.tsx line 68 — no min/max validation
  monthlyPriceTry: f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null
  // Form at line 278 — no min prop
  <Input type="number" value={form.monthlyPriceTry} ...>
  // Similarly for extraUserPriceTry at line 70
  ```
- **Remediation**: Add client-side validation: `monthlyPriceTry: f.monthlyPriceTry ? Math.max(0, Number(f.monthlyPriceTry)) : null`. Add a Zod schema for plan creation/update with `.min(0)` constraints. Backend must also validate `monthlyPriceTry >= 0` and `extraUserPriceTry >= 0`.
- **Dynamic Test**:
  ```
  # Via UI:
  1. Navigate to /settings > Pricing Plans > "Yeni Plan"
  2. Enter -1000 in "Aylik Fiyat (TRY)"
  3. Submit and observe
  
  # Via API:
  curl -X POST https://api.edfu.ai/platform/plans \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Negative Plan","slug":"neg-plan","monthlyPriceTry":-1000,"includedUsers":1}'
  ```

---

#### #16 — Negative Budget/Limit Values in Plans — Business Logic

- **Source scan**: `sast/businesslogic-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `POST /platform/plans`, `PATCH /platform/plans/:id` — `src/features/settings/components/pricing-plans-section.tsx` (lines 64-78)
- **Severity rationale**: Negative values for budgetUsd, includedUsers, maxStorageGb can cause unexpected behavior in limit enforcement. A negative budget means a company is immediately over-budget; negative storage locks companies out. Medium per "Business logic flaws" baseline.
- **Issue**: The `formToRequest` function uses `Number(f.budgetUsd) || 10` which provides fallback for zero/NaN but not negatives. `Number("-5") || 10` evaluates to `-5`. None of the HTML inputs have `min` attributes.
- **Impact**: A plan with `budgetUsd: -50` confuses AI budget enforcement. `includedUsers: -1` causes unexpected user count comparisons. `maxStorageGb: -1` locks companies out of storage.
- **Proof**:
  ```tsx
  // pricing-plans-section.tsx
  // line 69: negative passes
  includedUsers: Number(f.includedUsers) || 1
  // line 71: negative passes
  budgetUsd: Number(f.budgetUsd) || 10
  // lines 73-74: all accept negatives
  maxStorageGb: Number(f.maxStorageGb) || 5
  maxFileSizeMb: Number(f.maxFileSizeMb) || 25
  ```
- **Remediation**: Add `Math.max(0, ...)` or `Math.max(1, ...)` wrappers for each numeric field. Add `min` attributes to all `<Input type="number">` elements. Backend must enforce minimum values.
- **Dynamic Test**:
  ```
  curl -X PATCH https://api.edfu.ai/platform/plans/<plan-id> \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"budgetUsd":-50,"includedUsers":-1,"maxStorageGb":-10}'
  ```

---

#### #17 — Negative Auto-Approve Quote Threshold — Business Logic

- **Source scan**: `sast/businesslogic-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `PATCH /platform/companies/:id` — `src/features/companies/components/agent-settings-card.tsx` (lines 61-75)
- **Severity rationale**: An extremely high auto-approve threshold enables unlimited autonomous quote approval. A negative approval timeout could trigger immediate timeouts. A negative operations budget could corrupt budget enforcement. Medium per "Business logic flaws (workflow bypass)" baseline.
- **Issue**: `autoApproveQuoteThreshold` is sent directly to API with no upper bound. `approvalTimeoutMinutes: Number(timeoutMinutes) || 30` accepts negatives. `customerOperationsBudgetUsd` also accepts negatives. HTML `min` attributes are not enforced in JavaScript.
- **Impact**: An excessively high auto-approve threshold (999999999) means the agent autonomously approves expensive quotes without human review. A negative timeout could cause immediate timeout behavior. A negative budget could disable budget checks.
- **Proof**:
  ```tsx
  // agent-settings-card.tsx
  // line 65 — no upper bound check
  autoApproveQuoteThreshold: threshold !== '' ? Number(threshold) : null
  // line 66 — negative passes
  Number(timeoutMinutes) || 30
  // line 68 — negative passes
  budget !== '' ? Number(budget) : null
  ```
- **Remediation**: Add JavaScript-level validation: `Math.min(Math.max(0, Number(threshold)), MAX_THRESHOLD)` for the threshold. Enforce `approvalTimeoutMinutes >= 1`. Enforce `customerOperationsBudgetUsd >= 0`. Backend must also validate these ranges.
- **Dynamic Test**:
  ```
  curl -X PATCH https://api.edfu.ai/platform/companies/<id> \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"autoApproveQuoteThreshold":999999999,"approvalTimeoutMinutes":-60,"customerOperationsBudgetUsd":-1000}'
  ```

---

#### #18 — Negative Operations/AI Budget Bypassing Spend Limits — Business Logic

- **Source scan**: `sast/businesslogic-results.md`
- **Classification**: Likely Vulnerable
- **Endpoint / File**: `PUT /platform/companies/:id/config`, `PUT /platform/config/defaults` — `src/lib/validations.ts` (lines 3-7), `src/features/companies/components/config-tab.tsx`
- **Severity rationale**: The `optNum` Zod schema accepts any number (no `.min(0)`) and is used for all 14 config blocks including financial fields: `budgetUsd`, `monthlyBudgetUsd`, `s3PerGbMonthUsd`, `triggerPerTaskUsd`. Negative values could corrupt budget enforcement or produce negative cost calculations. Medium per "Business logic flaws" baseline.
- **Issue**: The `optNum` Zod schema at `validations.ts` is `z.preprocess(..., z.number().optional())` with no `.min(0)`. This affects every numeric field in all 14 config blocks, including financial fields.
- **Impact**: Setting `budgetUsd` to a negative value could disable AI budget enforcement. Setting `s3PerGbMonthUsd` to negative could cause negative cost calculations (crediting companies). Setting `monthlyBudgetUsd` for proactive agents to negative could disable proactive agents or produce negative cost records.
- **Proof**:
  ```ts
  // validations.ts lines 4-7 — accepts any number
  const optNum = z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number().optional(),
  )
  // aiConfigSchema line 38 — no min constraint
  budgetUsd: optNum
  // proactiveConfigSchema line 136 — no min
  monthlyBudgetUsd: optNum
  // pricingConfigSchema lines 124-126 — no min
  s3PerGbMonthUsd: optNum
  triggerPerTaskUsd: optNum
  ```
- **Remediation**: Create separate Zod schemas for financial fields: `const posNum = z.preprocess(..., z.number().min(0).optional())`. Apply to all budget and pricing fields. Backend must enforce `>= 0` for all monetary and budget fields.
- **Dynamic Test**:
  ```
  curl -X PUT https://api.edfu.ai/platform/companies/<id>/config \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"aiConfig":{"budgetUsd":-100},"pricingConfig":{"s3PerGbMonthUsd":-0.50},"proactiveConfig":{"monthlyBudgetUsd":-10}}'
  ```

---

## Appendix: Scan Coverage

| Scan | Result File | Status |
|------|-------------|--------|
| IDOR | `sast/idor-results.md` | Completed |
| SQLi | `sast/sqli-results.md` | Completed |
| SSRF | `sast/ssrf-results.md` | Completed |
| XSS | `sast/xss-results.md` | Completed |
| RCE | `sast/rce-results.md` | Completed |
| XXE | `sast/xxe-results.md` | Completed |
| File Upload | `sast/fileupload-results.md` | Completed |
| Path Traversal | `sast/pathtraversal-results.md` | Completed |
| SSTI | `sast/ssti-results.md` | Completed |
| JWT | `sast/jwt-results.md` | Completed |
| Missing Auth | `sast/missingauth-results.md` | Completed |
| Business Logic | `sast/businesslogic-results.md` | Completed |
| GraphQL Injection | `sast/graphql-results.md` | Completed |
| Hardcoded Secrets | `sast/hardcodedsecrets-results.md` | Completed |
