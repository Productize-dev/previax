# Buyer handbook

## Overview

Buyers are home shoppers. They explore communities in a Netflix-style catalog, use AI search and guidance, and keep a personal library of saves and likes. They never use the partner dashboard.

## How you get this account

1. Go to `/signup`.
2. Choose **Home buyer**.
3. Enter name, email, password.
4. On success (session created), you land on `/browse` (`APP_HOME`). Status is `active` immediately — no admin approval.

You can also browse as a **guest** without an account. Guests can explore most of the catalog; saves/likes still work in the browser, but there is no cloud profile.

## Works today

### Sign in and account

- `/login` — password or magic link.
- `/account` — display name, email (read-only), password reset email.
- Sign-out via buyer/account chrome.
- Account page still frames the experience around “Your library” even though saves are local to the browser.

### Browse and discover

- `/` — marketing Welcome page.
- `/browse` — cinematic homepage: hero, community/home/rent/video/lender rows, AI search overlay.
- `/communities/[id]` — community detail, video tours, financing offers (if any), realtor contact (mailto).
- `/communities/[id]/homes/[homeId]` — model/home detail.
- `/rent` and `/rent/[id]` — apartments catalog.

### Search and personalization

- Natural-language / AI search on browse (when OpenAI is configured).
- Filters from AI results applied into the browse experience.
- Personalized recommendation rows when signed in / when prefs exist.
- Voice search UI may show as “coming soon.”

### Guidance

- `/guidance` — quiz / lead form for personalized help.
- Prefs stored in browser (`buyer-storage`); lead may go out via Formspree/mailto depending on config.

### Saves and likes

- Save / like communities, homes, and apartments from tiles and detail pages.
- `/saved` — library tabs for saved items.
- **Persistence:** data lives in **localStorage** on this device (`src/lib/buyer-storage.ts`). Signing in does **not** yet sync lists to the server. The account page states cloud sync is future work.

### What buyers cannot do

- Open `/dashboard` (roles with dashboard access exclude `buyer`).
- Approve listings, edit catalog, or manage partner profiles.

## How it should work

1. **Cloud library** — saves, likes, and guidance prefs sync to the signed-in profile so switching devices keeps My List.
2. **Clear guest → account path** — guest can browse; saving prompts sign-in and merges local items into the cloud library.
3. **Role-aware account** — `/account` shows buyer context (library, guidance), not partner jargon.
4. **Trustworthy connect flows** — “talk to a realtor” / “get financing” should route to real Previax workflows or known partners, not only static mailto partnership inquiries.
5. **Guidance that sticks** — quiz answers drive ongoing browse personalization and can be edited later from account.

## Gaps summary

- Saves/likes/guidance are browser-local, not cloud-synced.
- Account page promises “sync preferences across devices” for sign-in, but lists do not sync yet.
- Realtor / lender CTAs are thin (mailto / partnership inquiry) vs marketing language.
- No in-app buyer help / tutorial beyond this handbook.

## Key code

- [`src/app/(auth)/signup/page.tsx`](../../src/app/(auth)/signup/page.tsx) — buyer signup option
- [`src/lib/auth/profile.ts`](../../src/lib/auth/profile.ts) — post-auth → `/browse` for buyers
- [`src/lib/buyer-storage.ts`](../../src/lib/buyer-storage.ts) — local saves/likes/prefs
- [`src/context/buyer-context.tsx`](../../src/context/buyer-context.tsx) — buyer UI state
- [`src/app/account/page.tsx`](../../src/app/account/page.tsx) — profile + library caveat
- [`src/components/home/netflix-homepage.tsx`](../../src/components/home/netflix-homepage.tsx) — browse home
