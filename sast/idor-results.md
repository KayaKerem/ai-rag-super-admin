# IDOR Analysis Results: ai-rag-super-admin

## Executive Summary
- Candidates analyzed: 9
- Vulnerable: 0
- Likely Vulnerable: 0
- Not Vulnerable: 0
- Needs Manual Review: 9

### Key Finding

**No traditional IDOR vulnerabilities were found in the frontend code.** This is because the application is a **super-admin dashboard** where all authenticated users are platform administrators with equal privileges. There is no horizontal access control between admin users — every admin can manage every resource by design.

However, all 9 candidates are classified as **Needs Manual Review** because the critical authorization enforcement happens **entirely on the backend** (`ai-rag-template`), which is outside the scope of this frontend-only codebase. The frontend's `AuthGuard` only checks for JWT presence — it does not verify roles, permissions, or resource ownership.

**The primary IDOR risk is vertical**: if a regular company user (non-admin) obtains a valid JWT and sends requests to `/platform/*` endpoints, can they access admin-only resources? The frontend provides zero defense against this — the backend must enforce the `isPlatformAdmin` check.

### Risk Prioritization (by impact if backend auth is missing)

| Priority | Candidate | Impact |
|---|---|---|
| CRITICAL | Service Account Password Reveal | Plaintext third-party service credentials exposed |
| CRITICAL | Company Config (GET/PUT) | AI API keys, S3 credentials, mail server credentials exposed/modifiable |
| HIGH | Company Status Change | Any company can be suspended/cancelled |
| HIGH | Company Plan Assignment | Plans can be changed, causing billing/service disruption |
| HIGH | Company User CRUD | Users can be created/deleted/role-changed in any company |
| HIGH | Permanent Lead Delete | Irreversible data destruction |
| MEDIUM | Pricing Plan CRUD | Platform-wide plan modifications |
| MEDIUM | Email Template CRUD | Template modification (potential stored XSS via email) |
| LOW | Proactive Insight Update | Status field modification only |

## Findings

### [NEEDS MANUAL REVIEW] 1. Get/Update/Delete Company by ID
- **File**: `src/features/companies/hooks/use-company.ts` (lines 8-43)
- **Endpoint**: `GET /platform/companies/:id`, `PATCH /platform/companies/:id`, `DELETE /platform/companies/:id`
- **Uncertainty**: The frontend uses the company ID directly from React Router's `useParams` and passes it to the API without any client-side ownership check. All authenticated users are platform admins, so there is no horizontal IDOR between admins. The risk is vertical: a regular company user's JWT reaching these endpoints. The frontend has no visibility into backend middleware. The mock handlers perform no auth checks (expected for mocks).
- **Suggestion**: Verify on the backend (`ai-rag-template`) that all `/platform/companies/*` routes are protected by middleware checking `isPlatformAdmin` or equivalent role in the JWT. Specifically confirm that `PATCH` and `DELETE` are not accessible with a regular user JWT.

### [NEEDS MANUAL REVIEW] 2. Get/Update Company Config
- **File**: `src/features/companies/hooks/use-company-config.ts` (lines 5-27)
- **Endpoint**: `GET /platform/companies/:id/config`, `PUT /platform/companies/:id/config`
- **Uncertainty**: The config endpoint exposes **sensitive data** including AI API keys, S3 credentials, mail server credentials, embedding API keys, Langfuse keys, and Cloudflare credentials. If a non-admin JWT can reach `GET /platform/companies/:id/config`, it would expose all API keys for that company. The `PUT` endpoint would allow overwriting a company's entire configuration, potentially redirecting their AI calls, S3 storage, or email delivery. The frontend provides no protection — it relies entirely on the backend to reject non-admin requests.
- **Suggestion**: On the backend, verify that both `GET` and `PUT` require platform admin role. Consider whether full API key values need to be returned (vs. masked versions) even for admins.

### [NEEDS MANUAL REVIEW] 3. Manage Company Users (CRUD + Bulk Import)
- **File**: `src/features/companies/hooks/use-company-users.ts` (lines 6-83)
- **Endpoint**: `GET /platform/companies/:id/users`, `POST /platform/companies/:id/users`, `POST /platform/companies/:id/users/invite`, `PATCH /platform/companies/:id/users/:userId`, `DELETE /platform/companies/:id/users/:userId`, `POST /platform/companies/:id/users/bulk-import`
- **Uncertainty**: This involves two levels of ID: company ID and user ID. The `PATCH .../users/:userId` endpoint is especially sensitive because it changes user roles — a non-admin attacker could promote themselves to `owner` of any company. The `DELETE .../users/:userId` could deactivate any user. Bulk import could inject users into any company. Additionally, if the backend doesn't validate that `userId` belongs to `companyId`, cross-company user manipulation could be possible even among legitimate admins.
- **Suggestion**: On the backend, verify: (1) All routes require platform admin role. (2) `PATCH` and `DELETE` for `/:userId` validate that the user actually belongs to the specified company. (3) Bulk import validates file content.

### [NEEDS MANUAL REVIEW] 4. Permanent Delete Lead
- **File**: `src/features/companies/hooks/use-leads.ts` (lines 17-28)
- **Endpoint**: `DELETE /platform/companies/:companyId/leads/:leadId/permanent`
- **Uncertainty**: Permanent, irreversible deletion with two IDOR vectors: (1) Non-admin access: regular company user JWT permanently deleting leads from any company. (2) Cross-company lead deletion: if the backend doesn't verify that `leadId` belongs to `companyId`. The mock handler scopes correctly (looks up by `companyId` then finds by `leadId`), suggesting the backend intends this, but actual implementation needs verification.
- **Suggestion**: Verify on the backend that the endpoint requires platform admin role and validates that `leadId` belongs to the specified `companyId`. Consider soft-delete given the irreversible nature.

### [NEEDS MANUAL REVIEW] 5. Update Proactive Insight Status
- **File**: `src/features/companies/hooks/use-proactive-insights.ts` (lines 41-52)
- **Endpoint**: `PATCH /platform/companies/:id/insights/:insightId`
- **Uncertainty**: Two-level ID pattern (company + insight). If the backend doesn't verify that `insightId` belongs to the specified company, insights could be modified across companies. The mock handler scopes the lookup correctly. Lower impact than other candidates since only `status` and `actionTaken` fields can be modified.
- **Suggestion**: Verify on the backend that platform admin role is required and that `insightId` is validated as belonging to the specified company.

### [NEEDS MANUAL REVIEW] 6. Service Account CRUD + Password Reveal
- **File**: `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 16-61)
- **Endpoint**: `GET /platform/service-accounts/:id/reveal`, `PATCH /platform/service-accounts/:id`, `DELETE /platform/service-accounts/:id`
- **Uncertainty**: **Highest-sensitivity candidate.** The `/reveal` endpoint returns **plaintext decrypted passwords** for third-party service accounts. If a non-admin JWT can reach this endpoint, they get plaintext credentials for external services (email providers, payment gateways, etc.). Service accounts are platform-level resources (not scoped to a company), so the only check needed is platform-admin role verification. The `PATCH` endpoint could modify credentials; `DELETE` removes them entirely.
- **Suggestion**: On the backend, verify: (1) All `/platform/service-accounts/*` routes require platform admin role. (2) The `/reveal` endpoint has additional protections: audit logging, rate limiting, and potentially MFA step-up. (3) Consider whether plaintext passwords should ever be sent to the frontend.

### [NEEDS MANUAL REVIEW] 7. Pricing Plan CRUD by ID
- **File**: `src/features/companies/hooks/use-pricing-plans.ts` (lines 16-65)
- **Endpoint**: `GET /platform/plans/:id`, `PATCH /platform/plans/:id`, `DELETE /platform/plans/:id`
- **Uncertainty**: Pricing plans are platform-level resources. The IDOR risk is whether a non-admin user can access these endpoints. The `PATCH` endpoint can modify plan limits (budget, storage, models, tools) affecting all companies on that plan. The `DELETE` endpoint deactivates a plan with broad impact.
- **Suggestion**: Verify all `/platform/plans/*` routes require platform admin role. Plan modifications should have audit logging given their broad impact.

### [NEEDS MANUAL REVIEW] 8. Email Template CRUD by Slug
- **File**: `src/features/email-templates/hooks/use-email-templates.ts` (lines 16-48)
- **Endpoint**: `GET /platform/email-templates/:slug`, `PATCH /platform/email-templates/:slug`, `POST /platform/email-templates/:slug/preview`
- **Uncertainty**: Email templates are platform-level resources identified by predictable slugs (`welcome`, `password-reset`, `invite`). If a non-admin user can modify templates, they could inject malicious HTML/JS into `bodyHtml`, leading to stored XSS delivered via email. They could also modify the password reset template to redirect users to a phishing site.
- **Suggestion**: Verify all `/platform/email-templates/*` routes require platform admin role. The `PATCH` endpoint should sanitize `bodyHtml` to prevent stored XSS.

### [NEEDS MANUAL REVIEW] 9. Company Plan Assignment & Status Management
- **File**: `src/features/companies/hooks/use-company-plan.ts` (lines 6-33), `src/features/companies/hooks/use-company-billing.ts` (lines 6-30)
- **Endpoint**: `PUT /platform/companies/:id/plan`, `DELETE /platform/companies/:id/pending-plan`, `PATCH /platform/companies/:id/status`
- **Uncertainty**: High-impact operations. `PUT .../plan` can change billing (upgrade/downgrade/remove). `PATCH .../status` can suspend or cancel any company. If a non-admin JWT reaches `PATCH /platform/companies/:id/status` with `{"status": "cancelled"}`, it would immediately disrupt that company's service.
- **Suggestion**: Verify all three endpoints require platform admin role. Status changes and plan assignments should be audit-logged. Consider requiring confirmation for destructive operations (suspend/cancel).
