# GhostWrite — Session Handoff

Last updated: 2026-06-24. This file is the at-a-glance catch-up for picking the
project back up (e.g. on a different PC) without needing the chat transcript.

## What this is
**GhostWrite** — a Next.js 14 AI-writing & academic-integrity SaaS for university
students in Botswana, South Africa, Namibia, Zambia, Zimbabwe (and globally).
Three tools + an honest bypass engine: **Humanizer**, **Bypass radar** (live
AI-detector gauge), **Citation Lab** (real DOI-verified sources), plus AI Chat,
Essay composer, history/analytics.

- **Repo:** github.com/ZachariahSamuel/GhostWrite — **PRIVATE**, branch `main`.
- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind v3 · Supabase
  (auth/Postgres/RLS) · Groq (BYO key, near-zero COGS) · Iconoir icons · sharp.

## Design system — "Campus Press" (locked, do not drift)
Warm-paper + riso + neo-brutalist fusion. Tokens in `styles/globals.css` +
`tailwind.config.js`:
- paper `#F4EFE6` · ink `#1A1A17` · riso blue `#2B44FF` · coral `#FF4D3D` ·
  sun `#FFC53D` · mint `#14C98A`
- Fonts: Clash Display (display) · General Sans (body) · JetBrains Mono.
- Signatures: 2px ink borders + hard offset shadows (`.b-card`, `.btn-*`),
  sticker tags (`.sticker`), `.eyebrow`, `.mark-hi`, `.riso-text`.
- Icons: **Iconoir** (lucide fully removed).
- Copy carries **balanced Gen-Z slang** ("no cap", "fr", "lock in", "lowkey",
  "it's giving") — keep it light.

## Mascot & logo — HANDS OFF unless asked
- Mascot **Casper** = `/public/casper.png` (user-supplied riso ghost: peace sign
  + book). Rendered by `components/ghost/Casper.tsx` via the `GhostRive` shim.
  Floats + has a state-driven aura (idle/writing/loading/success/error). No
  cursor-eye overlay (the art has its own face). Hero shows him **floating free,
  no box/card**.
- Logo = `components/ghost/CasperMark.tsx` using `/public/casper-logo.png`
  (a trimmed crop of the mascot), **no chip**, beside the "GhostWrite" wordmark.
- **Rule:** never invent / AI-generate a logo mark; only use the user's own
  mascot art. Do not touch the logo unless the user explicitly asks. (They
  rejected several AI-generated mark experiments.)

## Done
- Full Campus Press redesign of **every** surface: landing, login/register,
  dashboard shell + all tool pages (humanizer, bypass, citations, essay, chat,
  analytics, history, africa, settings), payment success/cancel.
- New mascot + logo wired everywhere; AI-slop sparkle removed from the art.
- Live detector gauge + LiveDemo + shared `lib/detector-score.ts` engine.
- Payments scaffolding: DPO Pay + Paystack (per-tier billing, hardened webhooks).
- **Production hardening:** `NEXT_PUBLIC_PREVIEW_BYPASS` removed — `/dashboard`
  now requires a real Supabase session.
- Repo set to private.
- Interactive-Casper Rive path scaffolded but **dormant** behind a flag
  (`NEXT_PUBLIC_CASPER_RIVE`); needs a real `.riv` rig to enable — see
  `docs/casper-rive.md`.

## ⚠️ Blockers / next steps
1. **Supabase is NOT wired yet** — `.env.local` has placeholder URL/key, so
   login + dashboard won't work until you point them at a real Supabase project
   and run the schema (see `lib/schema-patch.sql`).
2. Payment provider keys are empty (DPO/Paystack) — checkout is stubbed until set.
3. Paynow (Zimbabwe) not yet wired.
4. Deferred backlog: free-tier entitlement caps, Integrity Check feature,
   Trust/Ethics page, command palette, onboarding, PWA offline/service worker,
   Supabase RLS audit, university referencing presets, referral/student verify.

## Run it
```bash
npm install
# create .env.local (see below)
npm run dev          # http://localhost:3000
npm run build        # verify production build
npx tsc --noEmit     # typecheck
```

## Environment variables (`.env.local` — gitignored, recreate per machine)
Required for auth/data:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=...        # used by payment webhook
```
Optional / feature-specific:
```
GROQ_API_KEY=...           # server fallback; app is mainly BYO key (entered in UI)
OPENROUTER_API_KEY=...      # AI Chat extra models
GPTZERO_API_KEY=...         # live detector (else statistical "predicted" mode)
SAPLING_API_KEY=...
DPO_COMPANY_TOKEN=...  DPO_API_URL=...      # payments (DPO Pay)
PAYSTACK_SECRET_KEY=...                     # payments (Paystack)
NEXT_PUBLIC_CASPER_RIVE=true               # only if a /public/casper.riv rig exists
```

## Git / auth notes
- Commits/pushes go as **ZachariahSamuel** `<ZachariahSamuel99@gmail.com>`.
- This machine had two GitHub identities in Git Credential Manager
  (`Fanwell23-025` school + `ZachariahSamuel`); clearing the github.com
  credential let pushes resolve to ZachariahSamuel. On a new PC, clone the
  private repo and authenticate as ZachariahSamuel.
- `main` history was force-pushed over an older "Add files via upload" upload —
  `main` now == the real local project.

## Key files
- `styles/globals.css`, `tailwind.config.js` — design system + tokens.
- `components/ghost/` — Casper.tsx, CasperMark.tsx, GhostRive.tsx, CasperRive.tsx,
  LiveDetectorGauge.tsx.
- `lib/detector-score.ts` — shared client+server scoring engine.
- `lib/payment.ts` — markets, prices (BW P80 + FX-matched), tiers.
- `app/api/*` — humanize, chat, essay, citations, detect, dna, documents, export,
  payment/{create,verify,webhook,history}, auth/callback.
- `lib/schema-patch.sql` — Supabase schema to apply.
