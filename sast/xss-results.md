# XSS Analysis Results: ai-rag-super-admin

## Executive Summary
- Sink sites analyzed: 4
- Vulnerable: 0
- Likely Vulnerable: 0
- Not Vulnerable: 4
- Needs Manual Review: 0

## Findings

### [NOT VULNERABLE] dangerouslySetInnerHTML in ChartStyle component
- **File**: `src/components/ui/chart.tsx` (lines 94-113)
- **Endpoint / function / component**: `ChartStyle` component (part of shadcn/ui `ChartContainer`)
- **Reason**: The `ChartContainer` component (and its internal `ChartStyle` helper) is a standard shadcn/ui library component that is not imported or used anywhere in the application. No feature file imports `ChartContainer` -- all charts in the app use `recharts` directly (via `ResponsiveContainer`, `BarChart`, etc.) without going through the shadcn wrapper. Even if it were used, the `id` parameter is derived from `React.useId()` (a framework-generated stable identifier) or a developer-provided `id` prop, and the `config` object is a hardcoded `ChartConfig` type defined at the component call site with string keys and CSS color values. Neither flows from user input or API data. The `dangerouslySetInnerHTML` writes CSS custom property declarations into a `<style>` tag, which is a standard pattern in charting libraries for theme injection. No user-controlled data reaches this sink.

### [NOT VULNERABLE] iframe srcDoc with API-returned HTML in EmailPreview
- **File**: `src/features/email-templates/components/email-preview.tsx` (lines 69-75)
- **Endpoint / function / component**: `EmailPreview` component
- **Reason**: The iframe has `sandbox=""` (empty sandbox attribute), which is the most restrictive sandbox mode. An empty `sandbox` attribute disables: JavaScript execution, form submission, popups, top-level navigation, plugins, and same-origin access. This means even if the HTML returned by the backend contains `<script>` tags or event handlers like `onerror`, they will not execute. The HTML content comes from `POST /platform/email-templates/:slug/preview` which is a backend-rendered email template. The variables passed to the preview are hardcoded sample values defined in the `sampleVariables` constant (lines 5-38) -- not user-supplied. Additionally, this is a super-admin-only application where the admin is previewing their own email templates. The `sandbox=""` attribute effectively neutralizes any XSS risk from the rendered HTML.

### [NOT VULNERABLE] Dynamic href with API data in service-account-table
- **File**: `src/features/service-accounts/components/service-account-table.tsx` (lines 74-87)
- **Endpoint / function / component**: Service account URL column cell renderer
- **Reason**: The `url` value comes from the service accounts API (`GET /platform/service-accounts`), which returns data created by platform super-admins themselves. The code checks `url.startsWith('http')` -- if the URL starts with `http`, it is used directly; otherwise `https://` is prepended. A `javascript:` URI would NOT start with `http`, so the code would prepend `https://` making it `https://javascript:...` which is not a valid executable URI. The only way to get a `javascript:` URI into the href would be to have a URL like `http://javascript:alert(1)` which would simply be a broken HTTP URL, not an executable script. Additionally, the data is created by authenticated super-admins via the service account CRUD form, and the link opens in a new tab with `target="_blank"` and `rel="noopener noreferrer"`. This is not exploitable as XSS.

### [NOT VULNERABLE] window.location.href assignment with hardcoded string
- **File**: `src/lib/api-client.ts` (line 95)
- **Endpoint / function / component**: `clearAuthAndRedirect()` function
- **Reason**: The value assigned to `window.location.href` is the hardcoded string literal `'/login'`. No variable, user input, or dynamic data is involved in this assignment. This is a simple redirect to a fixed application route and cannot be exploited for XSS.
