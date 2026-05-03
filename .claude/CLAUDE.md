# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — runs `node seed.js && vite`. The seed step creates test auth accounts in Supabase (one per role) if they don't already exist, then starts the Vite dev server. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env` or it logs and skips silently.
- `npm run build` — `vite build` (outputs to `dist/`).
- `npm run lint` — ESLint across the repo (`eslint.config.js`, flat config, React 19 + hooks rules).
- `npm run preview` — preview the production build.

There is no test runner configured in this repo.

## Environment

Copy `.env.example` to `.env`. Required vars:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — client-side Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, used by `seed.js` and every file in `api/`. Never import from `src/`.
- `VITE_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` — Stripe checkout.
- `VITE_GEOAPIFY_API_KEY` — country/address autocomplete.

## Architecture

**Stack:** React 19 + Vite 8, React Router 7, Supabase (auth + Postgres + storage), Stripe, i18next (en/es/ar with RTL), Google Generative AI for the Sara assistant. No Tailwind — plain CSS colocated with components.

**Two-tier runtime.** The app is a SPA plus Vercel-style serverless functions in [api/](api/). In local dev, [vite.config.js](vite.config.js) installs a custom middleware plugin (`vercelApiPlugin`) that intercepts `/api/*` requests, dynamically imports the matching `.js` file, and adapts Node `req`/`res` to the Vercel handler shape (`res.status().json()`). In production, Vercel serves these directly; [vercel.json](vercel.json) rewrites everything else to `index.html` for SPA routing. When adding a new API route, just drop a file in `api/` exporting `default async function handler(req, res)` — no registration needed.

**Why the API layer exists.** The frontend uses the Supabase anon key; any operation needing the service role (creating users, deleting users, reading referral data across accounts, Stripe checkout) must go through `api/`. Do not attempt to do these from `src/`.

**Auth & profile shape.** [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx) is the single source of truth for the current user. On session init it fetches the `profiles` row and merges it into the Supabase user object, so `user.role`, `user.region`, `user.approval_status`, etc. are read directly off `user`. Google OAuth users without a profile get auto-created as `client` via `/api/update-profile`. When reading user data in components, use `useAuth()` — don't re-query Supabase for the current user.

**RBAC lives in [src/utils/roles.js](src/utils/roles.js).** It defines:
- `ROLES` (5 roles: super_admin, regional_admin, auditor, certification_body, client),
- `PERMISSIONS` (granular capability flags),
- `ROLE_PERMISSIONS` (role → permissions map),
- helpers: `hasPermission`, `canAccessRegion`, `getCreatableRoles`, `getRegionFromCountry` (country-name → region lookup).

Route-level enforcement is done in [src/App.jsx](src/App.jsx) via `<ProtectedRoute allowedRoles={...}>` or `<ProtectedRoute requiredPermission={...}>`. When adding a new protected page, wire it the same way — don't invent ad-hoc checks inside the page component.

**Regional filtering.** Non-super-admin roles are scoped to `user.region`. Every admin list view (applications, companies, auditors, CBs) must filter by region when the current user is a regional admin. Use `canAccessRegion(userRole, userRegion, targetRegion)` when checking individual records.

**Page layout.** Authenticated routes render inside `DashboardLayout` (Sidebar + TopBar). Auth pages render inside `AuthLayout`. The landing page and `/register/:type` pages are fully public.

**Certification lifecycle** (see `CERTIFICATION_STATUSES`): `pending → audit_scheduled → in_review → approved | rejected`. Status transitions drive what each role sees on the application detail view.

**Payment-gated CB visibility.** Clients should not see their assigned Certification Body's identifying details until payment is complete. When adding client-facing CB data, check payment status first — this is an explicit product rule, not a styling choice.

**i18n.** All user-facing strings go through `t('...')` from `react-i18next`. Locales live in [src/i18n/locales/](src/i18n/locales/) (`en.json`, `es.json`, `ar.json`). Arabic requires RTL layout support — test any new UI in all three. A `LanguageSuggestionPopup` auto-prompts users to switch based on browser language.

**Supabase schema.** The canonical schema is [supabase/schema.sql](supabase/schema.sql). The root-level `supabase_*.sql` files are historical setup scripts for incremental features (accreditation bodies, documents). Key tables: `profiles`, `applications`, `documents`, `referrals`, plus the accreditation/CB registry tables.

**Seed accounts.** [seed.js](seed.js) creates one test user per role (super_admin, regional_admin, auditor, certification_body, client) using the Supabase admin API. It runs automatically before `vite` on `npm run dev`. Test credentials are hardcoded in that file.

## Claude tooling

Project-level Claude Code primitives live under `.claude/`:

**Subagents** (auto-suggested by hooks, manually invokable via the Task tool):
- `rbac-auditor` — audits RBAC correctness after edits to `src/utils/roles.js`, `ProtectedRoute.jsx`, or route definitions.
- `api-security-reviewer` — flags missing JWT verification and forgeable IDs in `api/*` handlers.
- `supabase-migration-author` — drafts new `supabase/phaseN_*.sql` migrations in the project's idempotent style.
- `i18n-sync-checker` — verifies en/es/ar locale parity and flags hardcoded JSX strings.
- `cert-lifecycle-validator` — guards the `pending → audit_scheduled → in_review → approved/rejected` state machine and the payment-gated CB visibility rule.

**Skills** (user-invoked):
- `/rbac-matrix` — print the current role × permission table from `roles.js`.
- `/i18n-add <key.path> "<en text>"` — add a string to all three locales at once (es/ar marked `[DRAFT]`).
- `/i18n-audit` — diff en/es/ar for missing keys and empty values.
- `/api-route-new <name>` — scaffold a new `api/*.js` handler with JWT verification baked in.

**Hooks** (`.claude/settings.json`):
- PostToolUse on Edit/Write — runs the i18n audit when locale files change; prints reminders for `api/`, `roles.js`, and `ApplicationDetails.jsx` edits.
- PreToolUse on Bash `git commit` — runs lint (advisory) and i18n audit (blocking on structural drift). Set `CERTIFYCX_BLOCK_ON_LINT=1` to make lint blocking once the repo's existing lint errors are cleaned up.

**Supabase MCP** (configured per-developer in `.claude/settings.local.json`, gitignored). Service-role scope. **Rule:** any DB write via the MCP requires explicit user confirmation in the same turn — no implicit `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`. Configure against a dev/staging Supabase project, not production.
