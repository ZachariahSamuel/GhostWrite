'use client'
// ─────────────────────────────────────────────────────────────────────────────
// GhostWrite — LiveDetectorGauge  ◇ FLAGSHIP COMPONENT
//
// A real-time radial "human-likelihood" gauge. Pure SVG, zero dependencies,
// 3G-friendly. Animates smoothly between scores, shows threshold zones
// (AI / Mixed / Human), a pass-target marker at 80, a glowing live tip, and an
// optional transparent signal breakdown.
//
// Accessibility: role="meter" with aria-valuenow / valuetext, respects
// prefers-reduced-motion (snaps instead of animating), color is never the only
// signal (verdict text + numeric value always present).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import type { DetectorSignal, Verdict } from '@/lib/detector-score'

type Props = {
  /** 0–100 human-likelihood score */
  score: number
  verdict: Verdict
  /** pulse the tip + LIVE badge while the source text is actively changing */
  live?: boolean
  /** optional transparent breakdown of the contributing signals */
  signals?: DetectorSignal[]
  /** coaching tip — usually the weakest signal's hint */
  tip?: string
  size?: number
  label?: string
  /** pass threshold marker (default 80) */
  target?: number
  className?: string
}

const START_DEG = 135          // arc starts bottom-left
const SWEEP_DEG = 270          // 270° sweep, 90° gap at bottom

// color ramp by score (also exposed as CSS currentColor for glow)
function ramp(score: number): string {
  if (score >= 80) return '#14C98A' // mint — safe
  if (score >= 50) return '#E5A200' // sun (darkened for contrast on paper) — mixed
  return '#FF4D3D'                   // coral — likely AI
}

const VERDICT_COPY: Record<Verdict, { title: string; sub: string }> = {
  human:        { title: 'Reads human',     sub: 'Likely to pass detectors' },
  mixed:        { title: 'Partly flagged',  sub: 'Some AI tells remain' },
  ai:           { title: 'Reads as AI',     sub: 'Humanize before submitting' },
  insufficient: { title: 'Awaiting text',   sub: 'Add ~20+ words to score' },
}

// point on the gauge arc for a given 0–100 score (SVG coords, y-down)
function pointAt(score: number, cx: number, cy: number, r: number) {
  const deg = START_DEG + (Math.max(0, Math.min(100, score)) / 100) * SWEEP_DEG
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

// eased count-up / arc animation between score values
function useAnimatedScore(target: number, reduced: boolean) {
  const [val, setVal] = useState(target)
  const raf = useRef<number>()
  const from = useRef(target)
  useEffect(() => {
    if (reduced) { setVal(target); return }
    cancelAnimationFrame(raf.current!)
    const start = performance.now()
    const origin = from.current
    const delta = target - origin
    const dur = 650
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setVal(origin + delta * eased)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else from.current = target
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current!)
  }, [target, reduced])
  // keep `from` synced when reduced
  useEffect(() => { if (reduced) from.current = target }, [target, reduced])
  return val
}

export default function LiveDetectorGauge({
  score, verdict, live = false, signals, tip,
  size = 220, label = 'Human score', target = 80, className = '',
}: Props) {
  const reduced  = usePrefersReducedMotion()
  const animated = useAnimatedScore(verdict === 'insufficient' ? 0 : score, reduced)

  const stroke = 16
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - stroke / 2 - 2

  // pathLength normalises the full circle to 100 units → trivial arc math.
  // 270° arc = 75 units; each score point = 0.75 units.
  const ARC = (SWEEP_DEG / 360) * 100         // 75
  const unit = ARC / 100                       // 0.75
  const seg = (a: number, b: number) => ({
    strokeDasharray:  `${(b - a) * unit} 100`,
    strokeDashoffset: `${-a * unit}`,
  })

  const color   = verdict === 'insufficient' ? '#76726A' : ramp(score)
  const tipPt   = pointAt(verdict === 'insufficient' ? 0 : animated, cx, cy, r)
  const targetPt = pointAt(target, cx, cy, r)
  const targetInner = pointAt(target, cx, cy, r - stroke / 2 - 4)
  const targetOuter = pointAt(target, cx, cy, r + stroke / 2 + 4)

  const display = verdict === 'insufficient' ? '—' : Math.round(animated)
  const copy = VERDICT_COPY[verdict]

  // common circle props
  const base = {
    cx, cy, r, fill: 'none', pathLength: 100,
    transform: `rotate(${START_DEG} ${cx} ${cy})`,
    strokeLinecap: 'round' as const,
  }

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      role="meter"
      aria-valuenow={verdict === 'insufficient' ? undefined : Math.round(score)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={
        verdict === 'insufficient'
          ? 'Not enough text to score yet'
          : `${Math.round(score)} out of 100 — ${copy.title}`
      }
      aria-label={label}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* faint threshold zones — communicate the scale (AI / Mixed / Human) */}
          <circle {...base} stroke="#FF4D3D" strokeOpacity={0.22} strokeWidth={stroke} {...seg(0, 50)} />
          <circle {...base} stroke="#FFC53D" strokeOpacity={0.30} strokeWidth={stroke} {...seg(50, 80)} />
          <circle {...base} stroke="#14C98A" strokeOpacity={0.22} strokeWidth={stroke} {...seg(80, 100)} />

          {/* progress arc */}
          <circle
            {...base}
            stroke={color}
            strokeWidth={stroke}
            style={{ color, transition: reduced ? 'none' : 'stroke 0.4s ease' }}
            strokeDasharray={`${(verdict === 'insufficient' ? 0 : animated) * unit} 100`}
            strokeDashoffset={0}
          />

          {/* pass-target marker at 80 */}
          <line
            x1={targetInner.x} y1={targetInner.y} x2={targetOuter.x} y2={targetOuter.y}
            stroke="#1A1A17" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round"
          />

          {/* glowing live tip */}
          {verdict !== 'insufficient' && (
            <g style={{ color }}>
              <circle cx={tipPt.x} cy={tipPt.y} r={live ? 9 : 6} fill={color}
                opacity={live ? 0.25 : 0} className={live ? 'animate-gauge-pulse' : ''} />
              <circle cx={tipPt.x} cy={tipPt.y} r={5} fill={color}
                style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
              <circle cx={tipPt.x} cy={tipPt.y} r={2} fill="#F4EFE6" />
            </g>
          )}
        </svg>

        {/* center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-mono font-semibold tracking-[-2px] leading-none"
            style={{ fontSize: size * 0.26, color }}>
            {display}{verdict !== 'insufficient' && <span style={{ fontSize: size * 0.1 }}>%</span>}
          </div>
          <div className="font-mono font-bold uppercase tracking-widest mt-1.5"
            style={{ fontSize: size * 0.05, color }}>
            {copy.title}
          </div>
          <div className="font-mono text-mute mt-0.5" style={{ fontSize: size * 0.045 }}>
            {copy.sub}
          </div>
        </div>

        {/* LIVE badge */}
        {live && verdict !== 'insufficient' && (
          <div className="absolute top-1 right-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full
            bg-mint/15 border-2 border-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-gauge-pulse" />
            <span className="font-mono font-bold text-[9px] text-ink uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {/* axis labels */}
      <div className="flex justify-between w-full max-w-[200px] -mt-3 px-1">
        <span className="font-mono text-[9px] text-coral uppercase tracking-wider">AI</span>
        <span className="font-mono text-[9px] text-mint uppercase tracking-wider">Human</span>
      </div>

      {/* coaching tip */}
      {tip && verdict !== 'insufficient' && verdict !== 'human' && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-paper2 border-2 border-ink
          text-[11.5px] font-body text-ink2 leading-snug max-w-[260px] text-center">
          <span className="text-blue font-semibold">Tip · </span>{tip}
        </div>
      )}

      {/* transparent signal breakdown */}
      {signals && signals.length > 0 && (
        <div className="mt-4 w-full max-w-[280px] flex flex-col gap-2">
          {signals.map(s => (
            <div key={s.key} className="flex items-center gap-2.5" title={s.hint}>
              <span className="font-mono text-[10.5px] text-mute w-[92px] shrink-0 truncate">{s.label}</span>
              <div className="flex-1 h-2 rounded-full bg-paper2 border border-ink/20 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(s.value * 100)}%`,
                    background: ramp(s.value * 100),
                    transition: reduced ? 'none' : 'width 0.6s ease',
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-ink2 w-7 text-right tabular-nums">
                {Math.round(s.value * 100)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
