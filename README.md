# Indeks Głosowań

**indeksglosowan.pl** — read-only, login-free search index over Sejm RP voting records.

Forked from **Nawigator Wyborczy** — same Supabase database, same stack, new front door.

## What this is (and isn't)

- **Is:** a factual lookup tool. Search votings, see how every club and every MP voted,
  attendance and rebellion stats, canned ranking pages for organic search.
- **Isn't:** a swipe/quiz app. No accounts, no citizen votes, no profiles, no auth.
  That means near-zero GDPR surface and no personal data at rest.

## Stack

Next.js 15 (App Router, server components) · Supabase (Postgres, EU) · Tailwind + shadcn/ui ·
Vercel + Cloudflare. Identical to Nawigator — nothing new to run or pay for.

## Routes

| Route | Purpose |
|---|---|
| `/` | Search box, popular rankings, latest votings |
| `/glosowania` | Search + filters (query, druk, date range, outcome) + pagination |
| `/glosowanie/[id]` | Single voting: totals, club-by-club breakdown, expand to individual MPs, source links |
| `/poslowie` | MP index, filterable by club |
| `/posel/[id]` | MP profile: attendance, YES/NO/ABSTAIN split, votes against own club, history |
| `/partie` | Club index with cohesion + attendance |
| `/partia/[club]` | Club profile + MP list |
| `/rankingi` + `/rankingi/[slug]` | Canned SEO pages (absences, rebels, closest votes) |
| `/o-serwisie` | Methodology, sources, privacy |
| `/admin` | Curation table (display titles, summaries, categories) — gated by `ADMIN_SECRET` |
| `/api/cron/sync-latest-sitting` | Daily Vercel cron, 02:00 UTC |
| `/api/admin/sync`, `/api/admin/fix-druks`, `/api/admin/votings` | Maintenance |

Branding lives in one file: `lib/site.ts`.

## Setup

```bash
cp .env.example .env.local   # fill in Supabase + ADMIN_SECRET + CRON_SECRET
npm install
npm run dev
```

Then apply the two migrations to your Supabase project, in order:

```
supabase/migrations/0001_explorer_core.sql   # club_at_vote column, trigram indexes, public read RLS
supabase/migrations/0002_explorer_rpcs.sql   # all read RPCs the app calls
```

Both are additive and idempotent — safe to run against the database Nawigator already uses.

## Data model notes

- `politician_votes.club_at_vote` is added by migration 0001 and populated on every sync from
  0001 onward. It is backfilled from the MP's *current* club, so party attribution for votes
  synced **before** the migration is approximate for MPs who changed clubs. Re-syncing a sitting
  does not fix this retroactively — the Sejm API returns current membership only. Treat pre-migration
  party history with that caveat, or reconstruct it from club membership announcements if accuracy
  matters for a published claim.
- Vote corrections (*sprostowania*) are **not** modelled. Verify whether `api.sejm.gov.pl`
  exposes them before promising a "withdrawn votes" feature.

## Deliberately removed from the fork

Swipe card, anonymous vote tracking, `citizen_votes`, `profiles`, `saved_politicians`,
challenges, invitations, all Supabase Auth pages and forms, alignment RPCs, user dashboard,
Klaro consent banner + GA/Clarity (no cookies are set to visitors, so no banner is required —
re-add both together if you ever add analytics).

## Roadmap

Phase 2 is the public read API + MCP tool ("Kwerenda") with rate limiting — the piece that
later earns recurring revenue and ports to other parliaments.

## Attribution

Data from the official Sejm RP API (`api.sejm.gov.pl`). Verify the re-use terms before
charging for API access. The site is not affiliated with Kancelaria Sejmu.
