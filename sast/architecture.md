# Architecture: ai-rag-super-admin

## Technology Stack

| Category | Details |
|---|---|
| Languages | TypeScript 5.9, HTML/CSS (Tailwind CSS 4) |
| Frameworks | React 19 (Vite 8 SPA), React Router 7, TanStack React Query 5, React Hook Form 7, Zod 4 validation |
| UI Libraries | Radix UI primitives, shadcn/ui components, Recharts 3, Lucide icons, HugeIcons |
| Databases | None (frontend-only — all data via external REST API) |
| Auth mechanism | JWT (access + refresh tokens stored in `localStorage`). Axios interceptor adds `Bearer` token to all requests. Token refresh with queue-based retry on 401. |
| Infrastructure | Vercel (SPA with catch-all rewrite to index.html), pnpm package manager |
| External services | Backend REST API at `VITE_API_URL` (production: `api.edfu.ai`). MSW (Mock Service Worker) for dev-mode mocking. |
| State management | TanStack React Query for server state, React local state for UI |

## Architecture Overview

This is a **single-page application (SPA)** — a platform super-admin dashboard for managing an AI RAG (Retrieval-Augmented Generation) multi-tenant platform. It is a **frontend-only** project; all business logic, data persistence, and authentication live on a separate backend (`ai-rag-template`).

### Main Modules

| Module | Path | Responsibility |
|---|---|---|
| **Auth** | `src/features/auth/` | Login, JWT management, auth guard |
| **Dashboard** | `src/features/dashboard/` | Platform KPIs, cost trends, revenue summary, category breakdown |
| **Companies** | `src/features/companies/` | Full company CRUD, per-company config (AI, S3, mail, embedding, langfuse, trigger, limits, proactive, working hours, data retention, WhatsApp), users, usage, analytics, agent metrics, tool config, search analytics, activity log, leads, proactive insights |
| **Settings** | `src/features/settings/` | Platform defaults (14 config blocks), pricing plans, tool plans |
| **Email Templates** | `src/features/email-templates/` | List, edit, preview email templates |
| **Service Accounts** | `src/features/service-accounts/` | CRUD for third-party service credentials (passwords stored encrypted on backend) |
| **Mocks** | `src/mocks/` | MSW handlers + mock data for all API endpoints (dev only) |
| **UI Components** | `src/components/ui/` | Reusable shadcn/ui components (button, input, dialog, table, form, etc.) |
| **Lib** | `src/lib/` | API client (Axios), Zod validation schemas, query key factory, utilities |

### Component Interaction

```
Browser → React Router → AuthGuard → AppLayout → Feature Pages
                                                       ↓
                                              React Query hooks
                                                       ↓
                                              apiClient (Axios)
                                                       ↓
                                         Backend REST API (api.edfu.ai)
```

## Data Flow

### Authentication Flow
1. User submits email/password on `/login` → `POST /auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. All three stored in `localStorage` (`auth_access_token`, `auth_refresh_token`, `auth_user`)
4. `AuthGuard` checks `localStorage` for tokens — redirects to `/login` if absent
5. Axios request interceptor attaches `Bearer <accessToken>` to every API call
6. On 401 response: interceptor attempts `POST /auth/refresh` with `refreshToken`, queues concurrent requests, retries with new token
7. If refresh fails: clears `localStorage`, redirects to `/login`

### Core Business Flow (Company Management)
1. Admin navigates to `/companies` → `GET /platform/companies` fetches list
2. Admin selects company → `/companies/:id` → parallel fetches for company, config, users, usage, analytics, tool-config, etc.
3. Admin edits config (e.g., AI settings) → form validated by Zod schema → `PUT /platform/companies/:id/config`
4. Admin manages users → CRUD via `/platform/companies/:id/users/*`
5. Admin assigns plan → `PUT /platform/companies/:id/plan` with upgrade/downgrade logic

### Platform Settings Flow
1. Admin navigates to `/settings` → `GET /platform/config/defaults`
2. Admin edits any of 14 config blocks → Zod validation → `PUT /platform/config/defaults`
3. Pricing plans: `GET/POST/PATCH/DELETE /platform/plans`
4. Tool plans: `GET/PUT /platform/tool-plans`

## Entry Points

| Entry Point | Type | Auth Required | Description |
|---|---|---|---|
| `/login` | HTTP (React Route) | No | Login page with email/password form |
| `/` | HTTP (React Route) | Yes | Dashboard — platform KPIs, cost trends, revenue |
| `/companies` | HTTP (React Route) | Yes | Company list with create/search |
| `/companies/:id` | HTTP (React Route) | Yes | Company detail — 11 tabs (config, users, usage, analytics, etc.) |
| `/settings` | HTTP (React Route) | Yes | Platform defaults, pricing plans, tool plans |
| `/email-templates` | HTTP (React Route) | Yes | Email template management |
| `/service-accounts` | HTTP (React Route) | Yes | Service account credential management |

### API Endpoints Consumed (all via `apiClient`)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/auth/login` | POST | No | Login |
| `/auth/refresh` | POST | No | Token refresh |
| `/auth/logout` | POST | Yes | Logout |
| `/platform/companies` | GET/POST | Yes | List/create companies |
| `/platform/companies/:id` | GET/PATCH/DELETE | Yes | Company CRUD |
| `/platform/companies/:id/config` | GET/PUT | Yes | Company config |
| `/platform/companies/:id/users` | GET/POST | Yes | Company users |
| `/platform/companies/:id/users/invite` | POST | Yes | Invite user |
| `/platform/companies/:id/users/bulk-import` | POST | Yes | CSV import |
| `/platform/companies/:id/users/:userId` | PATCH/DELETE | Yes | User management |
| `/platform/companies/:id/usage` | GET | Yes | Usage data |
| `/platform/companies/:id/analytics` | GET | Yes | Analytics |
| `/platform/companies/:id/agent-metrics` | GET | Yes | Agent metrics |
| `/platform/companies/:id/tool-config` | GET/PUT | Yes | Tool configuration |
| `/platform/companies/:id/data-sources` | GET | Yes | Data sources |
| `/platform/companies/:id/search-analytics` | GET | Yes | Search analytics |
| `/platform/companies/:id/activity-log` | GET | Yes | Activity log |
| `/platform/companies/:id/activity-log/verify-integrity` | POST | Yes | Integrity check |
| `/platform/companies/:id/leads` | GET | Yes | Leads |
| `/platform/companies/:companyId/leads/:leadId/permanent` | DELETE | Yes | Permanent delete |
| `/platform/companies/:id/insights` | GET | Yes | Proactive insights |
| `/platform/companies/:id/insights/summary` | GET | Yes | Insight summary |
| `/platform/companies/:id/insights/:insightId` | PATCH | Yes | Update insight |
| `/platform/companies/:id/plan` | PUT | Yes | Assign plan |
| `/platform/companies/:id/pending-plan` | DELETE | Yes | Cancel downgrade |
| `/platform/companies/:id/status` | PATCH | Yes | Update subscription status |
| `/platform/companies/:id/billing-events` | GET | Yes | Billing events |
| `/platform/config/defaults` | GET/PUT | Yes | Platform defaults |
| `/platform/plans` | GET/POST | Yes | Pricing plans |
| `/platform/plans/:id` | GET/PATCH/DELETE | Yes | Plan CRUD |
| `/platform/models` | GET | Yes | Available AI models |
| `/platform/tool-plans` | GET/PUT | Yes | Tool plans |
| `/platform/data-source-types` | GET | Yes | Data source types |
| `/platform/data-sources` | GET | Yes | All data sources |
| `/platform/revenue` | GET | Yes | Revenue data |
| `/platform/email-templates` | GET | Yes | Email templates |
| `/platform/email-templates/:slug` | GET/PATCH | Yes | Template CRUD |
| `/platform/email-templates/:slug/preview` | POST | Yes | Template preview |
| `/platform/service-accounts` | GET/POST | Yes | Service accounts |
| `/platform/service-accounts/:id` | GET/PATCH/DELETE | Yes | Service account CRUD |
| `/platform/service-accounts/:id/reveal` | GET | Yes | Reveal password |
| `/platform/usage/summary` | GET | Yes | Platform usage summary |

## Trust Boundaries

1. **Browser ↔ Backend API**: The primary trust boundary. All user input is validated client-side with Zod schemas before being sent to the backend via Axios. However, the backend is the authoritative validator — client-side validation is for UX only.

2. **localStorage ↔ Application**: JWT tokens and user data are stored in `localStorage`, which is accessible to any JavaScript running on the same origin. This is a trust boundary — XSS would allow token theft.

3. **MSW Mock Layer ↔ Real API**: In development, MSW intercepts all API requests. The mock handlers accept any valid-looking input without real auth validation. This is isolated to `DEV` mode only.

4. **Admin User ↔ Platform**: The entire application assumes the user is a platform admin (`isPlatformAdmin: true`). There is no client-side role-based access control beyond the binary authenticated/not-authenticated check. Authorization enforcement relies on the backend.

5. **Service Account Passwords**: Passwords are stored encrypted on the backend. The frontend can request decryption via `/reveal` endpoint. The decrypted password travels over HTTPS but is then displayed in the browser UI.

## Sensitive Data Inventory

| Data Type | Where Stored | How Accessed | Protection |
|---|---|---|---|
| JWT Access Token | `localStorage` (`auth_access_token`) | Axios interceptor reads on every request | HTTPS in transit; no encryption at rest in browser |
| JWT Refresh Token | `localStorage` (`auth_refresh_token`) | Used only for token refresh on 401 | HTTPS in transit; no encryption at rest in browser |
| User Profile | `localStorage` (`auth_user`) | Parsed on app load for auth state | JSON, unencrypted |
| Admin Password | Form input only (never stored) | Sent via `POST /auth/login` | HTTPS in transit |
| API Keys (AI, rerank, embedding, Exa, Langfuse, S3, Cloudflare) | Entered in config forms, sent to backend | `PUT /platform/companies/:id/config` or `PUT /platform/config/defaults` | HTTPS; stored on backend |
| Service Account Passwords | Backend (encrypted), revealed on demand | `GET /platform/service-accounts/:id/reveal` | Encrypted at rest on backend; decrypted value displayed in UI |
| Email Content (templates) | Backend | `GET/PATCH /platform/email-templates/:slug` | Standard API auth |
| Company Data (PII: user emails, names, phone numbers) | Backend | Various `/platform/companies/` endpoints | Standard API auth |
| Lead Data (names, emails, phones) | Backend | `/platform/companies/:id/leads` | Standard API auth |
| Billing/Revenue Data | Backend | `/platform/revenue`, billing events | Standard API auth |
