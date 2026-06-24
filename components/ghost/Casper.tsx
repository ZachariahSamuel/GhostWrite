'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Casper — GhostWrite's mascot.  ◇ FLAGSHIP BRAND CHARACTER
//
// Renders the official Casper artwork (public/casper.png, transparent) with a
// state-driven aura + float / pop / shake motion (idle / writing / loading /
// success / error). The artwork has its own face, so no overlay is drawn.
// Reduced-motion safe (global rule). Keeps the CasperHandle API as a drop-in.
// ─────────────────────────────────────────────────────────────────────────────
import { forwardRef, useImperativeHandle, useState } from 'react'

export type CasperState = 'idle' | 'writing' | 'loading' | 'success' | 'error'

export interface CasperHandle {
  setState: (s: CasperState) => void
  getState: () => CasperState
}

interface Props {
  width?: number
  height?: number
  initialState?: CasperState
  className?: string
  float?: boolean
  /** zoom the artwork within its box */
  scale?: number
  // accepted for backwards-compat with the old GhostRive API (ignored)
  riv?: string
  logoSrc?: string
  onStateChange?: (from: CasperState, to: CasperState) => void
}

const AURA: Record<CasperState, string> = {
  idle:    'rgba(43,68,255,0.38)',
  writing: 'rgba(43,68,255,0.52)',
  loading: 'rgba(255,197,61,0.52)',
  success: 'rgba(20,201,138,0.52)',
  error:   'rgba(255,77,61,0.52)',
}

const Casper = forwardRef<CasperHandle, Props>(function Casper({
  width = 200, height = 200, initialState = 'idle',
  className = '', float = true, scale = 1.02, onStateChange,
}, ref) {
  const [state, setSt] = useState<CasperState>(initialState)

  useImperativeHandle(ref, () => ({
    setState: (s: CasperState) => setSt(prev => { if (prev !== s) onStateChange?.(prev, s); return s }),
    getState: () => state,
  }), [state, onStateChange])

  const aura   = AURA[state]
  const busy   = state === 'writing' || state === 'loading'
  const motion = state === 'error' ? 'casper-shake' : state === 'success' ? 'casper-pop' : float ? 'casper-float' : ''

  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width, height }}>
      {/* state aura — haloes the body so he sits naturally on any background */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none transition-[background] duration-500"
        style={{
          background: `radial-gradient(circle at 50% 52%, ${aura}, transparent 58%)`,
          filter: 'blur(20px)',
          animation: busy ? 'casperAura 1.5s ease-in-out infinite' : undefined,
        }}
      />
      <div className={`relative ${motion}`} style={{ lineHeight: 0 }}>
        <img
          src="/casper.png"
          alt="Casper, the GhostWrite mascot"
          width={width} height={height}
          draggable={false}
          className="select-none"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            filter: `drop-shadow(0 10px 22px ${aura})`,
          }}
        />
      </div>
    </div>
  )
})

export default Casper
