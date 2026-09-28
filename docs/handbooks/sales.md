# Sales handbook

## Overview

Sales users are internal (or contracted) listing agents. They create community drafts, complete Step 1 info and Step 2 video review, then submit into the admin → builder approval chain. They cannot self-register.

## How you get this account

1. An **admin** invites the person from Dashboard → **Sales team** (`/api/admin/invite-sales`).
2. Invitee opens the one-click invite link → `/set-password` (token_hash flow; works across devices).
3. Profile becomes `role: sales`, `status: active` (or existing user upgraded to sales).
4. Login thereafter → `/dashboard`.

**Not available on `/signup`.** DB signup trigger also blocks creating sales/admin via public metadata.

If invite email provider is not configured, admin copies the invite link from the UI and sends it manually.

## Works today

### Dashboard nav

| Tab | Purpose |
|-----|---------|
| Overview | Thin shortcuts + pipeline context |
| My pipeline | Full publishing pipeline for their submissions |
| Step 1 — Info | Community info wizard for new/in-progress listings |

### Publishing pipeline (happy path)

Statuses (see `pipelineStatusLabel`):

1. **draft** — Step 1 info in progress  
2. **awaiting_video** / **video_review** — Step 2 video work  
3. **pending_admin** — submitted for Previax admin  
4. **pending_builder** — admin approved; waiting on builder (deadline)  
5. **live** — public  
6. **rejected** — rejected with reason  

Sales can act on communities they **submitted** or **own** (`submitted_by` / `owner_id`). Actions go through `/api/pipeline/action` (`complete_step1`, `start_step2`, `submit_step2`, …). They do **not** perform `admin_approve` or `builder_approve` unless also admin.

Admins can also **assign** an existing community to a sales user from **All Communities → Assignment** (sets both `submitted_by` and `owner_id`). That listing then appears in that user’s pipeline without them having created it.

### Data scope

- Sees builders list (for assignment).
- Communities limited to ones they submitted/own.
- No homepage curation, featured, Top 10, lenders, apartments management.

### Notifications

- In-dashboard notifications bell for pipeline events (where wired).

### What sales cannot do

- Self-signup.
- Approve builder/lender accounts.
- Publish past admin/builder gates alone.
- Edit full catalog like an admin.

### Account page

- Shared `/account` still shows buyer library / local saves messaging.

## How it should work

1. **Documented role** — Sales appears in the public README role table and ops runbooks (invite steps, link fallback).
2. **Overview with KPIs** — drafts in progress, waiting on admin/builder, went live this week, aging deadlines.
3. **Sales account chrome** — role badge, pipeline deep link; no My List.
4. **Playbook in product** — short checklist for Step 1 fields and Step 2 video standards.
5. **Recovery** — clear path if invite link expired (admin resend from Sales team UI).

## Gaps summary

- Missing from README “Dashboard roles” table (until handbook + README update).
- Overview is thin vs pipeline depth.
- Account page buyer-centric.
- No in-app sales playbook beyond inline Step copy.

## Key code

- [`src/app/api/admin/invite-sales/route.ts`](../../src/app/api/admin/invite-sales/route.ts) — invite
- [`src/app/api/admin/manage-sales/route.ts`](../../src/app/api/admin/manage-sales/route.ts) — manage
- [`src/components/dashboard/sales-team-manager.tsx`](../../src/components/dashboard/sales-team-manager.tsx) — admin UI
- [`src/app/(auth)/set-password/page.tsx`](../../src/app/(auth)/set-password/page.tsx) — invite landing
- [`src/app/api/pipeline/action/route.ts`](../../src/app/api/pipeline/action/route.ts) — pipeline actions
- [`src/lib/sales-pipeline.ts`](../../src/lib/sales-pipeline.ts) — statuses / labels
- [`src/components/dashboard/pipeline-workspace.tsx`](../../src/components/dashboard/pipeline-workspace.tsx)
