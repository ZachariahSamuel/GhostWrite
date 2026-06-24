'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Casper — Rive implementation.  ◇ INTERACTIVE MASCOT
//
// Loads /casper.riv and drives its State Machine from the SAME CasperHandle API
// the PNG Casper exposes (setState / getState), so every existing caller works
// unchanged. Adds cursor-follow (eyes track the pointer) via optional look
// inputs. If the .riv can't load (missing file, parse error, or slow link),
// it calls onUnavailable() and the parent switcher swaps in the PNG Casper.
//
// ── .riv RIG CONTRACT ──  (rename the constants below if your rig differs)
//   Artboard       : "Casper"
//   State Machine  : "Casper"
//   Number input   : "state"  → 0 idle · 1 writing · 2 loading · 3 success · 4 error
//   Number input   : "lookX"  → -100..100  (optional — cursor X, eyes/head follow)
//   Number input   : "lookY"  → -100..100  (optional — cursor Y)
// See docs/casper-rive.md for how to build the rig + enable it.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from 'react'
import { useRive, useStateMachineInput, Fit, Alignment, Layout } from '@rive-app/react-canvas'
import type { CasperHandle, CasperState } from './Casper'

const ARTBOARD      = 'Casper'
const STATE_MACHINE = 'Casper'
const IN_STATE = 'state'
const IN_LOOKX = 'lookX'
const IN_LOOKY = 'lookY'

const STATE_NUM: Record<CasperState, number> = {
  idle: 0, writing: 1, loading: 2, success: 3, error: 4,
}

interface Props {
  width?: number
  height?: number
  initialState?: CasperState
  className?: string
  float?: boolean
  scale?: number
  // accepted for API parity with the PNG Casper / old GhostRive (ignored here)
  riv?: string
  logoSrc?: string
  onStateChange?: (from: CasperState, to: CasperState) => void
  /** called when the rig can't load — parent should fall back to the PNG Casper */
  onUnavailable?: () => void
}

const CasperRive = forwardRef<CasperHandle, Props>(function CasperRive({
  width = 200, height = 200, initialState = 'idle', className = '',
  onStateChange, onUnavailable,
}, ref) {
  const [state, setState] = useState<CasperState>(initialState)
  const gaveUp = useRef(false)

  const fail = () => { if (!gaveUp.current) { gaveUp.current = true; onUnavailable?.() } }

  const { rive, RiveComponent } = useRive({
    src: '/casper.riv',
    artboard: ARTBOARD,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: fail,
  })

  const stateInput = useStateMachineInput(rive, STATE_MACHINE, IN_STATE)
  const lookXInput = useStateMachineInput(rive, STATE_MACHINE, IN_LOOKX)
  const lookYInput = useStateMachineInput(rive, STATE_MACHINE, IN_LOOKY)

  // Drive the state machine from React state
  useEffect(() => { if (stateInput) stateInput.value = STATE_NUM[state] }, [state, stateInput])

  // Same handle the PNG Casper exposes — callers don't know which renders
  useImperativeHandle(ref, () => ({
    setState: (s: CasperState) => setState(prev => { if (prev !== s) onStateChange?.(prev, s); return s }),
    getState: () => state,
  }), [state, onStateChange])

  // If the runtime hasn't loaded the rig within 4s, treat it as unavailable
  useEffect(() => {
    if (rive) return
    const t = setTimeout(() => { if (!rive) fail() }, 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  // Cursor-follow — feed pointer position into the look inputs (rAF-throttled)
  const boxRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!lookXInput && !lookYInput) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = boxRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dx = Math.max(-100, Math.min(100, ((e.clientX - cx) / (r.width / 2)) * 100))
        const dy = Math.max(-100, Math.min(100, ((e.clientY - cy) / (r.height / 2)) * 100))
        if (lookXInput) lookXInput.value = dx
        if (lookYInput) lookYInput.value = dy
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [lookXInput, lookYInput])

  return (
    <div ref={boxRef} className={`relative inline-block ${className}`} style={{ width, height }}>
      <RiveComponent style={{ width, height }} />
    </div>
  )
})

export default CasperRive
