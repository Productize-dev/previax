# Previax

Cinematic real-estate platform for exploring premium residential communities (Netflix-style UX) with a multi-role dashboard for builders, lenders, and admins.

## Stack

- **Next.js 16** (App Router) + React 19
- **Supabase** — Postgres, Auth, Storage, RLS
- **Tailwind CSS 4** + shadcn/base-ui components
- **Vercel** — recommended deployment target

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) OpenAI API key for AI search, onboarding, and content generation

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Service role key — server only (cron, seed, admin scripts) |
| `OPENAI_API_KEY` | No | AI search, embeddings, onboarding, content generation |
| `OPENAI_EMBEDDING_MODEL` | No | Default: `text-embedding-3-small` (1536 dims) |
| `OPENAI_SEARCH_MODEL` | No | Default: `gpt-4.1-mini` (NL search, Structured Outputs) |
| `OPENAI_CONTENT_MODEL` | No | Default: `gpt-4.1` (listing extract + content generation) |
| `CRON_SECRET` | Prod | Secret for Vercel cron → `/api/cron/top10` |

\* Required for cron and `npm run seed`. The app runs without it if you only use the dashboard with anon key + RLS.

### 3. Database migrations

Apply migrations in order from `supabase/migrations/`:

```bash
# With Supabase CLI linked to your project:
supabase db push

# Or run SQL manually in the Supabase SQL editor (0001 → 0007).
```

Key migrations:

- `0001_init.sql` — schema, RLS, profiles, communities, Top 10, activity_events
- `0005_phase2_auth_rls.sql` — auth-hardened RLS
- `0006_ai_search_grants.sql` — pgvector search
- `0007_top10_signals.sql` — engagement tracking + auto Top 10 RPCs

### 4. Seed catalog (optional)

```bash
npm run seed
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

### 5. Embed catalog for AI search (optional)

```bash
npm run embed
```

Requires `OPENAI_API_KEY` (or runs heuristic-only without it).

### 6. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Dashboard roles

| Role | Access |
|------|--------|
| **Admin** | Full catalog, curation (Featured, Top 10), pending approvals, KPIs |
| **Builder** | Own builders, communities, model homes |
| **Lender** | Own lenders and financing offers |

New builder/lender signups start as `pending` until an admin approves them in the dashboard overview.

## Top 10 automation

Engagement signals (views, saves, offer clicks) are tracked via `track_community_event` RPC.

**Auto ranking** runs through `compute_top10(period)`:

- Score: views×1 + saves×3 + offer clicks×2
- Periods: `week`, `month`, `all-time`
- Manual admin overrides (`is_auto = false`) are preserved

**Cron (Vercel):** `vercel.json` schedules `GET /api/cron/top10` daily at 06:00 UTC. Set `CRON_SECRET` in Vercel env vars; the route expects `Authorization: Bearer <CRON_SECRET>`.

Admins can also click **Recompute now** in Dashboard → Top 10.

## Storage

Community/home images upload to Supabase Storage (`community-images` bucket). Ensure the bucket exists and policies allow authenticated uploads (see migration notes in `0001_init.sql`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build + typecheck |
| `npm run lint` | ESLint |
| `npm run seed` | Seed Supabase catalog |
| `npm run embed` | Generate embeddings for AI search |

## Deploy on Vercel

1. Import the Git repository
2. Add all env vars from `.env.example` (+ `CRON_SECRET`)
3. Deploy — cron is configured via `vercel.json`
4. Apply Supabase migrations on your production project

## Project structure

```
src/
  app/              # Routes (public site + dashboard + API)
  components/       # UI (netflix rows, dashboard, communities)
  context/          # Auth, catalog data, buyer preferences
  hooks/            # useDashboardData, useAiSearch
  lib/
    data/           # Repository pattern (Supabase + local fallback)
    ai/             # AI providers (search, onboarding, content)
    supabase/       # Client, admin, storage helpers
supabase/migrations/  # SQL schema + RLS
scripts/            # seed.ts, embed-catalog.ts
```

## License

Private — Previax.
