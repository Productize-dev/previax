# Builder handbook

## Overview

Builders manage their builder brand, communities, series, and model homes in the dashboard. They also approve communities that sales has prepared before those listings go live. Marketing also offers a **partner intake** path that does not create a dashboard account.

## How you get this account

### Path A — Self-serve signup (dashboard account)

1. `/signup` → choose **Builder**, provide company name.
2. Profile is created with `role: builder`, `status: pending`.
3. User sees `/pending-approval` until an admin sets status to `active` (or `rejected`).
4. Once active, login goes to `/dashboard`.

Public signup **cannot** choose `admin`. Requesting admin in metadata is forced to buyer in the DB trigger.

### Path B — Marketing partner flow (no account)

1. `/partner` — questionnaire + schedule meeting (Formspree/mailto + Calendly-style flow).
2. Does **not** create a `profiles` row or dashboard login.
3. Ops must manually create/approve a builder account later if they should get dashboard access.

These two paths coexist today and can confuse partners.

## Works today

### Pending state

- `/pending-approval` — generic waiting (or rejected) message; sign out link.
- No ETA, no “resend,” no status email from the app itself.

### Dashboard (active builders only)

Access gated by `canAccessDashboard` (`active` + builder/lender/admin/sales).

Scoped data (`scopeDashboardData`): only builders owned by this user, communities owned/linked to those builders (including `pending_builder` handoffs), related series. No lenders, no homepage curation, no other builders’ catalogs.

After admin approves a builder **login**, an admin should set **Account owner** on the matching builder org (Builders → Edit) and link communities under **All Communities → Assignment**. Until `builders.owner_id` points at that login, **My Communities** / **Approvals** stay empty even if orgs exist.

**Nav (sidebar):**

| Tab | Purpose |
|-----|---------|
| Overview | Stats / shortcuts for their scope |
| Builders | Edit own builder profile(s), marketing visibility |
| My Communities | Communities + homes/series CRUD, media, AI/CSV helpers where enabled |
| Approvals | Publishing pipeline items waiting on builder (`pending_builder`) |

### Approvals pipeline

When sales/admin send a community to the builder:

1. Status `pending_builder` (deadline based on `BUILDER_APPROVAL_DAYS`).
2. Builder **approve** → community can go `live` (or auto-publish cron may apply in some cases).
3. Builder **reject** → rejected with reason.

Builders do not run admin approve or sales Step 1/2 for others’ listings.

### Public presence

- Approved/live communities appear on marketing `/` and `/browse`.
- Builder logos can appear on the Welcome trusted-builders strip when marked for marketing.

### What builders cannot do

- Approve other users’ accounts.
- Edit homepage Featured / Top 10 / layout.
- Use admin AI Assistant.
- See full lender/sales team tools.

### Account page

- `/account` is shared and still buyer-oriented (library / local saves copy). Company name from signup is not editable there.

## How it should work

1. **One onboarding story** — either partner intake creates a pending builder account, or marketing clearly separates “talk to us” vs “get dashboard access,” with a single recommended path.
2. **Pending experience** — email on submit, progress/ETA, contact link, and redirect into dashboard the moment an admin approves.
3. **Builder account chrome** — `/account` shows role, company, and dashboard link; not My List.
4. **Clear Approvals UX** — builders understand deadline, what they’re signing off on (media, copy, pricing), and what “live” means publicly.
5. **Light help** — short in-product checklist: create builder → add community → homes → wait for sales video handoff if applicable.

## Gaps summary

- Dual onboarding: `/partner` (no account) vs `/signup` builder (pending account).
- Pending page is minimal.
- Account page is buyer-centric; company not editable post-signup.
- No builder-specific help in the app.
- No AI Assistant for builders (admin-only).

## Key code

- [`src/app/(auth)/signup/page.tsx`](../../src/app/(auth)/signup/page.tsx) — builder role + company
- [`src/app/partner/page.tsx`](../../src/app/partner/page.tsx) — marketing intake
- [`src/lib/dashboard-scope.ts`](../../src/lib/dashboard-scope.ts) — builder scoping
- [`src/components/dashboard/dashboard-sidebar.tsx`](../../src/components/dashboard/dashboard-sidebar.tsx) — builder nav
- [`src/app/api/pipeline/action/route.ts`](../../src/app/api/pipeline/action/route.ts) — `builder_approve` / `builder_reject`
- [`src/app/(auth)/pending-approval/page.tsx`](../../src/app/(auth)/pending-approval/page.tsx)
