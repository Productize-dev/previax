# Admin handbook

## Overview

Admins operate the full Previax catalog and marketplace: approve partner accounts, curate the homepage, run the publishing pipeline, invite sales, and use the catalog AI Assistant. This is the only role with complete platform access.

## How you get this account

**Not available via `/signup`.** The auth trigger forces any requested `admin` role to `buyer`.

### First admin (bootstrap)

1. Sign up normally (e.g. as buyer) with the intended admin email.
2. In Supabase SQL editor (service / privileged):

```sql
update public.profiles
   set role = 'admin', status = 'active'
 where email = 'you@example.com';
```

3. Sign out and back in → `/dashboard` with full admin nav.

Additional admins: same SQL pattern (or future invite tooling — not built as a first-class UI today).

## Works today

### Dashboard access

Requires `role: admin` and `status: active`. Full unscoped catalog (`scopeDashboardData` returns everything).

### Nav (sidebar)

| Area | Tabs |
|------|------|
| Assistant | AI Assistant (catalog help / ops Q&A) |
| Builders | Builders, All Communities |
| Rentals | Apartments |
| Sales pipeline | Publishing pipeline, Sales team |
| Lenders | Lender profiles (all) |
| Homepage | Homepage Layout, Featured Carousel, Featured Communities, Top 10 |

Plus **Overview** with KPIs, activity, and **pending accounts** card (approve/reject builder & lender signups).

### Approving partners

1. Builder or lender signs up → `pending`.
2. Admin sees them on overview pending list.
3. Approve → `active` (they can use dashboard); reject → `rejected` (pending page message).

Approving a builder account does **not** auto-link a `/partner` Formspree submission — that remains a manual ops step. After approval, link the login to a builder org via **Builders → Edit → Account owner**, and assign communities under **All Communities → Assignment**.

### Assigning communities (sales + builders)

On **All Communities** (edit community), the **Assignment** block lets admins:

1. **Assigned sales** — sets `submitted_by` and `owner_id` so that sales user sees the listing in their pipeline.
2. **Builder org(s)** — single / multi / none (same as before), so the community is linked to catalog builder profiles.

On **Builders** (edit builder):

3. **Account owner** — sets `builders.owner_id` to an active builder login so **My Communities** and **Approvals** populate for that user.

### Publishing pipeline

Admin can:

- Review items in `pending_admin` → approve (moves toward builder) or reject.
- Oversee / intervene on pipeline alongside sales and builders (`pipeline/action` allows admin on gated actions).
- Invite and manage sales users (email + copyable invite link).

Cron may auto-publish some `pending_builder` items after deadline (`/api/cron/pipeline-auto-publish`) depending on deployment.

### Homepage curation

- Layout / series rows for browse.
- Featured carousel items.
- Featured communities.
- Top 10 slots — manual overrides preserved; **Recompute now** + daily cron (`/api/cron/top10`) for auto ranking from engagement signals.

### AI Assistant

- Admin-only API (`/api/ai/assistant`). Used for catalog-oriented help inside the dashboard.

### What only admin can do

- Approve accounts, invite sales, full pipeline override, homepage writes, see all tenants’ data, AI assistant.
- Assign communities to sales users and builder orgs; assign builder account owners.

## How it should work

1. **Bootstrap documented** — first-admin SQL (or a one-time CLI) remains the standard; handbook + README stay aligned.
2. **Partner intake → account** — optional ops workflow: Formspree/Calendly lead becomes a pending builder with company prefilled, one click to approve. (Today: approve signup, then set Account owner + community Assignment manually.)
3. **Safer multi-admin** — invite second admin without raw SQL; audit log of approvals.
4. **Ops handbook in product** — Assistant + short checklists for “go-live a community” and “onboard a builder.”
5. **Clear separation** — marketing CTAs don’t promise capabilities that only exist after admin setup.

## Gaps summary

- First admin requires SQL (by design today; must stay documented).
- Partner Formspree path disconnected from `profiles`.
- No dedicated admin help center beyond Assistant + this handbook.
- Sales role historically missing from README role table (addressed when linking these handbooks).

## Key code

- [`supabase/migrations/0005_phase2_auth_rls.sql`](../../supabase/migrations/0005_phase2_auth_rls.sql) — block admin self-signup; bootstrap comment
- [`src/lib/auth/profile.ts`](../../src/lib/auth/profile.ts) — dashboard gate
- [`src/lib/dashboard-scope.ts`](../../src/lib/dashboard-scope.ts) — full catalog for admin
- [`src/components/dashboard/dashboard-sidebar.tsx`](../../src/components/dashboard/dashboard-sidebar.tsx) — admin nav
- [`src/components/dashboard/pending-accounts-card.tsx`](../../src/components/dashboard/pending-accounts-card.tsx)
- [`src/components/dashboard/sales-team-manager.tsx`](../../src/components/dashboard/sales-team-manager.tsx)
- [`src/app/api/ai/assistant/route.ts`](../../src/app/api/ai/assistant/route.ts)
