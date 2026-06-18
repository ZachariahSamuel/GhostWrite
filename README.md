# GhostWrite — Next.js Production App

> Invisible craft. Visible results.

AI-powered writing intelligence platform for African students and professionals.
Built by Meta-Genesis, Francistown, Botswana.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS v3 + custom CSS tokens |
| Auth | Supabase Auth (email + OAuth) |
| Database | Supabase Postgres + RLS |
| AI Inference | Groq free API (llama-3.3-70b-versatile) |
| Animation | GhostRive (Rive JS + canvas fallback) |
| Deployment | Vercel (zero config) |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL, anon key, and optionally a server-side Groq key.

### 3. Set up Supabase database
Run `phantom-schema.sql` in your Supabase SQL Editor.

### 4. Add your logo
Place `ghost-logo.png` in the `public/` folder.
Place `ghostwrite-rive.js` in the `public/` folder.
Place `ghostwrite.riv` in the `public/` folder (optional — falls back to canvas animation).

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
# Push to GitHub, then:
vercel --prod
# Or connect repo in Vercel dashboard — zero config needed
```

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Sign in (Supabase auth + GhostRive) |
| `/register` | Create account |
| `/dashboard/humanizer` | AI Humanizer — main tool |
| `/dashboard/chat` | Multi-model chat (GhostAll) |
| `/dashboard/essay` | Essay Composer |
| `/dashboard/bypass` | 6-detector bypass checker |
| `/dashboard/citations` | Citation Lab |
| `/dashboard/history` | Document history |
| `/dashboard/analytics` | Usage analytics |
| `/dashboard/africa` | Africa Suite |
| `/dashboard/settings` | Account settings |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/humanize` | POST | Stream humanization via Groq |
| `/api/chat` | POST | Stream chat response via Groq |
| `/api/essay` | POST | Stream essay composition via Groq |
| `/api/citations` | POST | Generate verified citations via Groq |

## GhostRive Animation

Place `ghostwrite-rive.js` in `public/`. The `GhostRive` React component:
- Loads `ghostwrite.riv` if present (your Rive export)
- Falls back to canvas-coded animation automatically
- Exposes `setState('idle'|'writing'|'loading'|'success'|'error')`
- Wired to auth events, Groq streaming, and bypass results

```tsx
const ghostRef = useRef<GhostRiveHandle>(null)
// ...
ghostRef.current?.setState('writing')  // Groq starts streaming
ghostRef.current?.setState('success')  // Humanization complete
ghostRef.current?.setState('error')    // API error
```

## Brand

- **Colors**: Phantom Purple `#7C5CFC`, Void Black `#0A0A0F`, Bypass Green `#10B981`
- **Fonts**: Playfair Display (display), Inter (body), JetBrains Mono (stats), Space Grotesk (labels/buttons)
- **Tagline**: Invisible craft. Visible results.

Built by [Meta-Genesis](https://metagenesis.co.bw) — Francistown, Botswana.

## Gap Fixes Applied (v2)

### Critical (all 4 fixed)
1. **OAuth callback** — `app/auth/callback/route.ts` handles Google/GitHub/email confirmation
2. **API architecture** — Groq key via `Authorization: Bearer` header, never in body
3. **Credit enforcement** — `lib/credits.ts` checks + consumes credits on every API route
4. **Email confirmation** — `redirectTo` points to callback, confirmation screen shown

### Serious (gaps 5–9 fixed)
5. **Real bypass detection** — GPTZero + Sapling live APIs, statistical predictor for others
6. **Multi-model chat** — Groq (Llama/Mixtral/Gemma) + OpenRouter (GPT-4o/Claude/Gemini/Grok)
7. **History persisted** — every humanization/essay auto-saved to Supabase `documents` table
8. **Writing DNA** — analysis engine extracts fingerprint, injected into humanizer prompts
9. **Export** — DOCX via `docx` package (server), PDF via jsPDF (client-side CDN)

## New Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Optional | Server-side fallback Groq key |
| `OPENROUTER_API_KEY` | Optional | Unlocks GPT-4o, Claude, Gemini in chat |
| `GPTZERO_API_KEY` | Optional | Live GPTZero detection (free tier available) |
| `SAPLING_API_KEY` | Optional | Live Sapling detection (free tier available) |

All detector and model keys are **optional** — the app falls back to statistical analysis and Groq-only models if absent.

## New API Routes

| Route | Method | Description |
|---|---|---|
| `/auth/callback` | GET | OAuth + email confirmation handler |
| `/api/detect` | POST | 6-detector bypass check |
| `/api/documents` | GET/POST/DELETE | Document persistence |
| `/api/dna` | GET/POST/DELETE | Writing DNA profile |
| `/api/export` | POST | DOCX download + PDF data |
