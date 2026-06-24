'use client'
// ─────────────────────────────────────────────────────────────────────────────
// GhostRive — the mascot switcher every surface imports.
//
// Decides, on the client, whether to render the INTERACTIVE Rive Casper or the
// lightweight PNG Casper, and forwards the ref to whichever it mounts — so the
// CasperHandle (setState/getState) API is identical either way.
//
// Rive is used only when ALL of these hold:
//   • NEXT_PUBLIC_CASPER_RIVE === 'true'           (opt-in flag)
//   • the user hasn't requested reduced motion
//   • the connection isn't Save-Data / 2g          (protect low-data markets)
// …and even then, if /casper.riv fails to load, CasperRive calls onUnavailable
// and we fall back to the PNG. Default (flag unset) = PNG, zero Rive cost.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, lazy, Suspense, useEffect, useState } from 'react'
import Casper from './Casper'
import type { CasperHandle, CasperState } from './Casper'

// Lazy so the Rive runtime (~150 KB) only downloads when Rive is actually used.
// React.lazy forwards refs through the forwardRef default export.
const CasperRive = lazy(() => import('./CasperRive'))

export type { CasperHandle as GhostRiveHandle, CasperState as GhostState } from './Casper'

interface Props {
  width?: number
  height?: number
  initialState?: CasperState
  className?: string
  float?: boolean
  scale?: number
  riv?: string
  logoSrc?: string
  onStateChange?: (from: CasperState, to: CasperState) => void
}

function riveEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_CASPER_RIVE !== 'true') return false
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  const c: any = (navigator as any).connection
  if (c && (c.saveData || /(^|[^a-z])2g$/.test(c.effectiveType || ''))) return false
  return true
}

const GhostRive = forwardRef<CasperHandle, Props>(function GhostRive(props, ref) {
  // Start on PNG (SSR-safe); upgrade to Rive after the client check passes.
  const [mode, setMode] = useState<'png' | 'rive'>('png')
  useEffect(() => { if (riveEnabled()) setMode('rive') }, [])

  if (mode === 'rive') {
    return (
      <Suspense fallback={<Casper {...props} />}>
        <CasperRive ref={ref} {...props} onUnavailable={() => setMode('png')} />
      </Suspense>
    )
  }
  return <Casper ref={ref} {...props} />
})

export default GhostRive
