# Interactive Casper (Rive)

The mascot integration is **wired up and dormant**. It renders the lightweight
PNG Casper today, and lights up an interactive Rive Casper the moment you:

1. add a rig at **`public/casper.riv`**, and
2. set **`NEXT_PUBLIC_CASPER_RIVE=true`** in `.env.local` (then restart `next dev`).

No code changes needed — `components/ghost/GhostRive.tsx` auto-switches.

## Why it's opt-in
Rive's runtime + canvas adds ~150 KB and GPU cost. Our users are in low-data
Southern-African markets on budget Androids, so `GhostRive` only uses Rive when:
the flag is on **and** the user hasn't requested reduced motion **and** the
connection isn't Save-Data / 2g. If `/casper.riv` ever fails to load, it falls
back to the PNG automatically. Default (flag unset) = PNG, zero Rive cost.

## The rig contract
Build this in the [Rive editor](https://rive.app) and export `casper.riv`.
The names below must match (or edit the constants at the top of
`components/ghost/CasperRive.tsx`):

| Thing          | Name     | Notes |
|----------------|----------|-------|
| Artboard       | `Casper` | the mascot artwork |
| State Machine  | `Casper` | the controller |
| Number input   | `state`  | `0` idle · `1` writing · `2` loading · `3` success · `4` error |
| Number input   | `lookX`  | optional · `-100..100` · cursor X → eyes/head follow |
| Number input   | `lookY`  | optional · `-100..100` · cursor Y |

The app sets `state` whenever it calls `ghostRef.current?.setState(...)`
(writing while humanizing, success/error on result, etc.) and streams
`lookX`/`lookY` from the pointer. Wire those inputs to blend states / bone
constraints in the state machine and Casper comes alive.

## How callers use it (unchanged)
Every surface imports the same component and handle:

```tsx
const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })
const ref = useRef<GhostRiveHandle>(null)
// ...
<GhostRive ref={ref} width={210} height={210} initialState="idle" />
ref.current?.setState('writing')   // drives Rive `state` input, or PNG aura
```
