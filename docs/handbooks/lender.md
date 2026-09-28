# Lender handbook

## Overview

Lenders publish a financing partner profile and community-linked offers (rates, terms, CTAs). Shoppers see those offers on community detail pages. Lenders have the thinnest dashboard of the partner roles.

## How you get this account

1. `/signup` → choose **Lender**, provide company name.
2. Profile: `role: lender`, `status: pending`.
3. Wait on `/pending-approval` until an admin activates the account.
4. Active lenders land on `/dashboard` after login.

There is **no** lender equivalent of `/partner` (builders have marketing intake; lenders mainly use mailto partnership CTAs on the public site).

## Works today

### Dashboard

Scoped to lenders owned by this user and their offers. Communities are visible as a **catalog** for attaching offers (not for editing listings).

**Nav:**

| Tab | Purpose |
|-----|---------|
| Overview | Basic lender-oriented shortcuts / stats |
| Profile & offers | Lender profile CRUD + financing offers |

Offers can target communities; they surface on public community pages (financing section) and can feed engagement tracking (offer clicks) used in Top 10 scoring.

### Public side

- Browse may show a lenders row when data exists.
- Marketing language like “Finance with confidence” may still open a **partnership inquiry mailto**, not a lender discovery or pre-approval product.
- Buyers do not get an in-app mortgage application — offers are informational / outbound CTAs as configured on each offer.

### What lenders cannot do

- Edit communities, builders, homepage, or pipeline.
- Approve accounts or invite sales.
- Use admin AI Assistant.

### Account page

- Shared `/account` with buyer library messaging; not lender-specific.

## How it should work

1. **Discoverable financing** — browse and community pages present real lender partners and offers as a first-class journey (compare / inquire), not a generic partnership mailto.
2. **Offer lifecycle** — draft → publish → pause; clear preview of how an offer appears on a community.
3. **Light analytics** — clicks, saves-with-offer, which communities perform best for this lender.
4. **Lender account chrome** — company, role badge, link to Profile & offers; no My List.
5. **Optional intake** — a `/partner`-style lender path that creates a pending lender account for ops to approve.

## Gaps summary

- Product story on marketing ≠ lender dashboard capability (mailto vs offers).
- Single dashboard tab; limited analytics.
- Account page buyer-centric.
- No dedicated lender onboarding / help.

## Key code

- [`src/app/(auth)/signup/page.tsx`](../../src/app/(auth)/signup/page.tsx) — lender signup
- [`src/lib/dashboard-scope.ts`](../../src/lib/dashboard-scope.ts) — lender + offers scope
- [`src/components/dashboard/dashboard-sidebar.tsx`](../../src/components/dashboard/dashboard-sidebar.tsx) — lender nav
- [`src/components/dashboard/lenders-workspace.tsx`](../../src/components/dashboard/lenders-workspace.tsx) — profile & offers UI
- [`src/components/dashboard/lender-offer-list.tsx`](../../src/components/dashboard/lender-offer-list.tsx)
