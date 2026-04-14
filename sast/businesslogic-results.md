# Business Logic Analysis Results: ai-rag-super-admin

## Executive Summary
- Scenarios analyzed: 11
- Exploitable: 0
- Likely Exploitable: 5
- Not Exploitable: 2
- Needs Manual Review: 4

---

## Findings

### [LIKELY EXPLOITABLE] Negative or zero pricing on plan creation/update
- **Category**: Price & Payment Manipulation
- **File**: `src/features/settings/components/pricing-plans-section.tsx` (lines 64-78)
- **Endpoint**: `POST /platform/plans` and `PATCH /platform/plans/:id`
- **Business Rule Violated**: Plan prices must be either null (enterprise) or a positive number
- **Issue**: The `formToRequest` function converts the price field with `f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null`. While this correctly treats empty/falsy input as null (enterprise), it does not prevent negative values. A negative string like "-500" is truthy, so `Number("-500")` yields `-500` which is sent to the API. The HTML `<Input type="number">` has no `min` attribute, so the browser allows negative input. The Zod validation in `configBlockSchemas` is not used for plan creation -- the `formToRequest` function bypasses schema validation entirely, doing raw `Number()` coercion.
- **Concern**: If the backend does not validate that `monthlyPriceTry >= 0`, a plan with a negative price could be created. This could corrupt revenue calculations (`mockRevenue.mrrTry` sums plan prices), cause financial discrepancies in billing, or create plans where companies receive credits instead of being charged.
- **Proof**: In `pricing-plans-section.tsx` line 68: `monthlyPriceTry: f.monthlyPriceTry ? Number(f.monthlyPriceTry) : null` -- no min/max validation. The form at line 278 uses `<Input type="number" value={form.monthlyPriceTry} ...>` with no `min` prop. Similarly for `extraUserPriceTry` at line 70.
- **Remediation**: Add client-side validation: `monthlyPriceTry: f.monthlyPriceTry ? Math.max(0, Number(f.monthlyPriceTry)) : null`. Better yet, add a Zod schema for plan creation/update with `.min(0)` constraints. The backend must also validate `monthlyPriceTry >= 0` and `extraUserPriceTry >= 0`.
- **Dynamic Test**:
  ```
  1. Navigate to /settings and open Pricing Plans section
  2. Click "Yeni Plan" (New Plan) button
  3. Fill required fields (name, slug)
  4. In "Aylik Fiyat (TRY)" field, enter -1000
  5. Click "Olustur" (Create)
  6. Observe whether the plan is created with a negative price
  7. If created, assign this plan to a company and check revenue calculations
  
  Alternative (direct API):
  curl -X POST https://api.edfu.ai/platform/plans \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Negative Plan","slug":"neg-plan","monthlyPriceTry":-1000,"includedUsers":1}'
  ```

### [LIKELY EXPLOITABLE] Negative or zero values for budget and financial limits in plans
- **Category**: Quantity & Numeric Limit Violations
- **File**: `src/features/settings/components/pricing-plans-section.tsx` (lines 64-78)
- **Endpoint**: `POST /platform/plans` and `PATCH /platform/plans/:id`
- **Business Rule Violated**: All numeric plan fields (budgetUsd, includedUsers, maxStorageGb, etc.) must be positive
- **Issue**: The `formToRequest` function uses `Number(f.budgetUsd) || 10` for budget and similar patterns for other fields. The `||` operator provides a fallback for zero/NaN but not for negative values. For example, `Number("-5") || 10` evaluates to `-5` (truthy), not `10`. The `includedUsers` field uses `Number(f.includedUsers) || 1`, which would accept `-1`. The `maxStorageGb` uses `Number(f.maxStorageGb) || 5`, accepting `-10`. None of the HTML inputs have `min` attributes.
- **Concern**: A plan with `budgetUsd: -50` could confuse the AI budget enforcement (backend may compare `usedBudget < budgetUsd`, and with a negative budget, the company would be immediately over-budget). A plan with `includedUsers: -1` could cause unexpected behavior in user count comparisons. `maxStorageGb: -1` could lock a company out of storage.
- **Proof**: `pricing-plans-section.tsx` line 69: `includedUsers: Number(f.includedUsers) || 1` -- negative passes. Line 71: `budgetUsd: Number(f.budgetUsd) || 10` -- negative passes. Lines 73-74: `maxStorageGb: Number(f.maxStorageGb) || 5`, `maxFileSizeMb: Number(f.maxFileSizeMb) || 25` -- all accept negatives.
- **Remediation**: Add `Math.max(0, ...)` or `Math.max(1, ...)` wrappers for each numeric field. Add `min` attributes to all `<Input type="number">` elements. Backend must enforce minimum values.
- **Dynamic Test**:
  ```
  1. Navigate to /settings > Pricing Plans
  2. Edit an existing plan
  3. Set "AI Butce (USD)" to -50
  4. Set "Dahil Kullanici" to -1
  5. Set "Maks Depolama (GB)" to -10
  6. Click "Guncelle" (Update)
  7. Verify whether the API accepts negative values
  
  curl -X PATCH https://api.edfu.ai/platform/plans/<plan-id> \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"budgetUsd":-50,"includedUsers":-1,"maxStorageGb":-10}'
  ```

### [LIKELY EXPLOITABLE] Negative auto-approve quote threshold enabling unlimited auto-approval
- **Category**: Quantity & Numeric Limit Violations
- **File**: `src/features/companies/components/agent-settings-card.tsx` (lines 61-75)
- **Endpoint**: `PATCH /platform/companies/:id`
- **Business Rule Violated**: autoApproveQuoteThreshold should have a reasonable upper bound; approvalTimeoutMinutes must be positive
- **Issue**: The `handleSave` function sends `autoApproveQuoteThreshold: threshold !== '' ? Number(threshold) : null` directly to the API. While the HTML input has `min={0}`, this is a client-side-only constraint easily bypassed. Setting this to an extremely large value (e.g., 999999999) would make the agent auto-approve virtually any quote. Setting `approvalTimeoutMinutes: Number(timeoutMinutes) || 30` -- a negative timeout value would pass (e.g., -60 is truthy). Additionally, `customerOperationsBudgetUsd: budget !== '' ? Number(budget) : null` accepts negatives (e.g., -1000), which could corrupt budget enforcement.
- **Concern**: An excessively high auto-approve threshold means the agent autonomously approves expensive quotes without human review. A negative or zero approval timeout could cause immediate timeout behavior. A negative operations budget could disable budget checks or cause unexpected behavior.
- **Proof**: `agent-settings-card.tsx` line 65: `autoApproveQuoteThreshold: threshold !== '' ? Number(threshold) : null` -- no upper bound check. Line 66: `Number(timeoutMinutes) || 30` -- negative passes. Line 68: `budget !== '' ? Number(budget) : null` -- negative passes. The HTML `min={0}` at line 128 and `min={1}` at line 141 are only HTML attributes, not enforced in JavaScript.
- **Remediation**: Add JavaScript-level validation: `Math.min(Math.max(0, Number(threshold)), MAX_THRESHOLD)` for the threshold. Enforce `approvalTimeoutMinutes >= 1`. Enforce `customerOperationsBudgetUsd >= 0`. Backend must also validate these ranges.
- **Dynamic Test**:
  ```
  1. Navigate to /companies/<id> and open Agent Settings
  2. Set "Otomatik Onay Esigi ($)" to 999999999
  3. Set "Onay Zaman Asimi (dk)" to -60
  4. Set "Operasyon Butcesi ($)" to -1000
  5. Click "Kaydet"
  6. Verify whether the API accepts these values
  
  curl -X PATCH https://api.edfu.ai/platform/companies/<id> \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"autoApproveQuoteThreshold":999999999,"approvalTimeoutMinutes":-60,"customerOperationsBudgetUsd":-1000}'
  ```

### [LIKELY EXPLOITABLE] Negative operations budget or AI budget bypassing spend limits
- **Category**: Transfer & Balance Logic
- **File**: `src/lib/validations.ts` (lines 3-7), `src/features/companies/components/agent-settings-card.tsx` (line 68), `src/features/companies/components/config-tab.tsx` (lines 38-48)
- **Endpoint**: `PATCH /platform/companies/:id` and `PUT /platform/companies/:id/config`
- **Business Rule Violated**: All budget values (budgetUsd, monthlyBudgetUsd, customerOperationsBudgetUsd) must be non-negative
- **Issue**: The `optNum` Zod schema at `validations.ts` line 4-7 is defined as `z.preprocess(..., z.number().optional())` with no `.min(0)` constraint. This schema is used for every numeric field in all 14 config blocks, including financial fields like `budgetUsd` (AI budget), `monthlyBudgetUsd` (proactive agent budget), `s3PerGbMonthUsd` (pricing), and `triggerPerTaskUsd` (pricing). The Zod validation will pass any number including negatives. The `ConfigAccordion` component at `config-accordion.tsx` line 54-63 strips empty/undefined/NaN values but does not check for negative numbers. The cleaned values are sent directly to `PUT /platform/companies/:id/config`.
- **Concern**: Setting `budgetUsd` to a negative value (e.g., -100) could disable the AI budget enforcement entirely if the backend compares `usedBudget < budgetUsd` (a negative budget means the company is always over-budget, or conversely, if the check is `usedBudget <= budgetUsd`, a negative budget immediately triggers the downgrade threshold). Setting `s3PerGbMonthUsd` to a negative value could cause negative cost calculations, effectively crediting companies for storage use. Setting `monthlyBudgetUsd` for proactive agents to a negative value could disable proactive agents or produce negative cost records.
- **Proof**: `validations.ts` lines 4-7: `const optNum = z.preprocess((v) => (...Number(v)), z.number().optional())` -- accepts any number. `aiConfigSchema` line 38: `budgetUsd: optNum` -- no min constraint. `proactiveConfigSchema` line 136: `monthlyBudgetUsd: optNum` -- no min. `pricingConfigSchema` lines 124-126: `s3PerGbMonthUsd: optNum`, `triggerPerTaskUsd: optNum` -- no min.
- **Remediation**: Create separate Zod schemas for financial fields: `const posNum = z.preprocess(..., z.number().min(0).optional())`. Apply to all budget and pricing fields. Backend must enforce `>= 0` for all monetary and budget fields.
- **Dynamic Test**:
  ```
  1. Navigate to /companies/<id> > Config tab > AI Config
  2. Set "AI Butce (USD)" to -100
  3. Click "Kaydet"
  4. Check if the config is saved with a negative budget
  
  curl -X PUT https://api.edfu.ai/platform/companies/<id>/config \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"aiConfig":{"budgetUsd":-100},"pricingConfig":{"s3PerGbMonthUsd":-0.50},"proactiveConfig":{"monthlyBudgetUsd":-10}}'
  ```

### [LIKELY EXPLOITABLE] Service account password reveal without re-authentication
- **Category**: Entitlement & Access Bypass
- **File**: `src/features/service-accounts/hooks/use-service-accounts.ts` (lines 16-22), `src/features/service-accounts/components/service-account-table.tsx` (lines 41-63)
- **Endpoint**: `GET /platform/service-accounts/:id/reveal`
- **Business Rule Violated**: Revealing sensitive credentials should require re-authentication or a second factor
- **Issue**: The `useRevealPassword` hook performs a simple `GET` request to `/platform/service-accounts/:id/reveal` using the standard Bearer token from the Axios interceptor. There is no additional authentication challenge (password re-entry, TOTP, or confirmation code). The reveal button in `ServiceAccountTable` triggers this mutation with a single click. Since JWT tokens are stored in `localStorage` (accessible to any JS on the same origin), a stolen token grants immediate access to all service account passwords. There is no rate limiting visible on the client side. The revealed password is displayed in a dialog and can be copied to clipboard.
- **Concern**: Service accounts store third-party credentials (email/password for external services like Google, GitHub, SSO providers, API keys). If the admin's JWT token is compromised (e.g., via XSS -- JWT in localStorage is a known risk), the attacker can enumerate all service accounts via `GET /platform/service-accounts` and then reveal each password via `/reveal`. This provides the attacker access to all third-party services the organization uses, far beyond the scope of the AI RAG platform itself.
- **Proof**: `use-service-accounts.ts` lines 16-22: `useRevealPassword` is a simple GET mutation with no additional auth parameters. `service-account-table.tsx` lines 41-63: The `RevealButton` component calls `reveal.mutate(undefined, {...})` with no confirmation or re-auth step beyond the single click.
- **Remediation**: Add a re-authentication step before revealing passwords: require the admin to re-enter their password or provide a TOTP code. Implement server-side rate limiting on the `/reveal` endpoint (e.g., max 5 reveals per minute). Add audit logging for each reveal action. Consider short-lived reveal tokens instead of returning the password in the API response.
- **Dynamic Test**:
  ```
  1. Log in as admin and note the JWT access token from localStorage
  2. In a new browser/incognito window (simulating token theft), use the stolen token:
  
  curl https://api.edfu.ai/platform/service-accounts \
    -H "Authorization: Bearer <stolen-token>"
  
  3. For each returned service account, reveal the password:
  
  curl https://api.edfu.ai/platform/service-accounts/<id>/reveal \
    -H "Authorization: Bearer <stolen-token>"
  
  4. Verify that all passwords are returned without any additional authentication challenge
  5. Test rapid enumeration: loop through all IDs and reveal all passwords in under 10 seconds
  ```

---

### [NEEDS MANUAL REVIEW] Manipulating plan upgrade/downgrade logic via price confusion
- **Category**: Workflow & Multi-Step Process Bypass
- **File**: `src/features/companies/hooks/use-company-plan.ts` (lines 6-19), `src/mocks/handlers.ts` (lines 449-494)
- **Endpoint**: `PUT /platform/companies/:id/plan`
- **Uncertainty**: The upgrade/downgrade decision logic lives on the backend. The MSW mock handler reveals the intended logic: `monthlyPriceTry: null` (enterprise) is treated as `Infinity` for comparison, meaning enterprise plans are always upgrades (immediate). When a company has no plan, `currentPrice = 0`, so any plan is an upgrade. This is potentially by design. The real backend implementation may handle these edge cases differently. Since we only have the mock handler as reference and cannot inspect the real backend, we cannot confirm whether these edge cases are properly handled.
- **Suggestion**: Manually verify on the real backend: (1) Can a company be assigned an enterprise plan (null price) and then downgraded to a paid plan, bypassing the downgrade scheduling? (2) Does assigning the same plan trigger a no-op or create duplicate billing events? (3) Is pro-rata calculation correct when currentPrice is 0? Test with: `curl -X PUT /platform/companies/<id>/plan -d '{"planId":"<enterprise-plan-id>"}'`.

### [NEEDS MANUAL REVIEW] Subscription status transition without business rule validation
- **Category**: Workflow & Multi-Step Process Bypass
- **File**: `src/features/companies/components/plan-tab.tsx` (lines 195-206)
- **Endpoint**: `PATCH /platform/companies/:id/status`
- **Uncertainty**: The frontend presents all three status options (active, suspended, cancelled) regardless of current state, but the actual transition validation happens on the backend. The MSW mock handler only validates that the status is one of three valid values but does not check transition validity. The real backend may implement a proper state machine. Key concerns: (1) Can a cancelled company be reactivated directly without a new subscription? (2) Can a suspended company be cancelled and then reactivated, potentially resetting billing cycles? (3) Is the `trialing` state protected?
- **Suggestion**: Test the real backend with: `curl -X PATCH /platform/companies/<id>/status -d '{"status":"active"}'` on a cancelled company. Check if `trialing` or `past_due` can be set via this endpoint. Verify billing event history for reactivated companies.

### [NEEDS MANUAL REVIEW] Config limit values without lower/upper bounds enabling resource abuse
- **Category**: Quantity & Numeric Limit Violations
- **File**: `src/lib/validations.ts` (lines 79-109)
- **Endpoint**: `PUT /platform/companies/:id/config` and `PUT /platform/config/defaults`
- **Uncertainty**: The `limitsConfigSchema` uses `optNum` (unbounded `z.number().optional()`) for all 25+ numeric fields. Critical fields like `crawlConcurrency`, `queueConcurrency*`, `embeddingBatchSize`, and `maxStorageMb` have no bounds. While the frontend Zod validation accepts any number, the backend may enforce its own limits. Without access to backend code, we cannot determine whether extreme values (e.g., crawlConcurrency: 999999) would be accepted or rejected.
- **Suggestion**: Test with extreme values on the real backend: `curl -X PUT /platform/config/defaults -d '{"limitsConfig":{"crawlConcurrency":999999,"maxStorageMb":0}}'`. Also test company-specific config overrides.

### [NEEDS MANUAL REVIEW] Bulk user import without file validation enabling exceeded user limits
- **Category**: Quantity & Numeric Limit Violations
- **File**: `src/features/companies/components/csv-import-dialog.tsx` (lines 24-37), `src/features/companies/hooks/use-company-users.ts` (lines 68-83)
- **Endpoint**: `POST /platform/companies/:id/users/bulk-import`
- **Uncertainty**: The CSV import dialog displays "max 500 satir" as informational text but does not validate row count or file size. The file is sent as raw FormData. Whether the backend enforces row limits and plan user count limits cannot be determined from frontend code alone.
- **Suggestion**: Test with a CSV file containing 10,000 rows against a plan with `includedUsers: 5`. Verify backend enforcement of row limits and plan constraints.

---

### [NOT EXPLOITABLE] Email template HTML injection via bodyHtml field
- **Category**: Workflow & Multi-Step Process Bypass
- **File**: `src/features/email-templates/components/email-template-edit-dialog.tsx` (lines 33-45)
- **Endpoint**: `PATCH /platform/email-templates/:slug`
- **Business Rule**: Email template HTML should be safe for recipients
- **Protection**: This is a super-admin panel where the admin is a trusted user intentionally editing email templates. The bodyHtml field is by design an HTML editor. Template editing is the core feature, not a vulnerability. Backend-side email rendering and sanitization is the appropriate control layer.

### [NOT EXPLOITABLE] Permanent lead deletion without confirmation or audit safeguards
- **Category**: Workflow & Multi-Step Process Bypass
- **File**: `src/features/companies/components/leads-tab.tsx` (lines 59-68, 123-138)
- **Endpoint**: `DELETE /platform/companies/:companyId/leads/:leadId/permanent`
- **Business Rule**: Permanent deletions should have safety mechanisms
- **Protection**: The frontend implements a confirmation dialog with a clear KVKK/GDPR warning. The backend returns a task ID indicating async processing -- a GDPR-compliant data erasure pattern. Individual-only deletion (no batch) in the UI. This is a legitimate admin function for regulatory compliance.
