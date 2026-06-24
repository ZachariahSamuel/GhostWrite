'use client'
import { useState, useEffect } from 'react'
import { useDash } from '../layout'
import LiveDetectorGauge from '@/components/ghost/LiveDetectorGauge'
import { analyzeText, type ScoreResult } from '@/lib/detector-score'

type DetResult = { score: number; label: string; live: boolean; name: string }
type Results   = Record<string, DetResult>

const DET_ORDER = ['turnitin','gptzero','originality','copyleaks','zerogpt','sapling']

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-xl2 bg-paper border-2 border-ink">
      <div className="eyebrow text-[9px] text-mute">{label}</div>
      <div className="font-mono font-semibold text-[13px] text-ink mt-0.5 truncate max-w-[120px]">{value}</div>
    </div>
  )
}

const col = (v: number) => (v >= 80 ? '#14C98A' : v >= 60 ? '#E5A200' : '#FF4D3D')

export default function BypassPage() {
  const { groqKey, ghostRef } = useDash()
  const [text,    setText]    = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [summary, setSummary] = useState<{ average:number; allPass:boolean; verdict:string } | null>(null)
  const [running, setRunning] = useState(false)
  const [err,     setErr]     = useState('')

  const [live,   setLive]   = useState<ScoreResult>(() => analyzeText(''))
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    setTyping(true)
    const t = setTimeout(() => { setLive(analyzeText(text)); setTyping(false) }, 220)
    return () => clearTimeout(t)
  }, [text])

  const run = async () => {
    if (!text.trim() || running) return
    setRunning(true); setResults(null); setSummary(null); setErr('')
    ghostRef.current?.setState('loading')

    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Detection failed'); ghostRef.current?.setState('error'); setTimeout(() => ghostRef.current?.setState('idle'), 2000); return }

      setResults(data.results)
      setSummary(data.summary)

      if (data.summary.allPass) {
        ghostRef.current?.setState('success')
        setTimeout(() => ghostRef.current?.setState('idle'), 2500)
      } else {
        ghostRef.current?.setState('error')
        setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      }
    } catch(e: any) {
      setErr(e.message || 'Network error')
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setRunning(false)
  }

  return (
    <div className="animate-fade-up max-w-6xl mx-auto">

      {/* ── Live detector gauge — flagship ── */}
      <div className="b-card rounded-xl3 p-5 md:p-6 mb-5 grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex justify-center">
          <LiveDetectorGauge
            score={live.humanScore}
            verdict={live.verdict}
            live={typing && text.trim().length > 0}
            signals={live.signals}
            tip={live.weakest?.hint}
            size={224}
          />
        </div>
        <div>
          <div className="eyebrow text-[10px] text-blue mb-2">Real-time bypass radar</div>
          <h2 className="font-display font-semibold text-[22px] md:text-[26px] text-ink tracking-[-0.01em] leading-tight mb-2">
            Watch your score climb as you write
          </h2>
          <p className="text-ink2 text-[13px] leading-relaxed mb-4 max-w-md">
            Every keystroke is scored instantly against the same statistical model
            our six detectors use — no waiting, no API round-trip. Cross the
            <span className="font-semibold mark-hi"> 80 mark</span> and you're in the human zone. no cap.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <Stat label="Words" value={live.wordCount.toString()} />
            <Stat label="Verdict" value={live.verdict === 'insufficient' ? '—' : live.verdict.toUpperCase()} />
            <Stat label="Weakest" value={live.weakest?.label ?? '—'} />
          </div>
        </div>
      </div>

      {/* Summary banner */}
      {summary && (
        <div className="flex items-center justify-between px-5 py-4 rounded-xl3 mb-5 border-2 border-ink text-white"
          style={{ background: summary.allPass ? 'var(--mint)' : summary.average >= 70 ? 'var(--sun)' : 'var(--coral)',
                   color: summary.average >= 70 && !summary.allPass ? '#1A1A17' : '#fff' }}>
          <div>
            <div className="font-mono font-semibold text-[13px] mb-0.5">{summary.verdict}</div>
            <div className="text-[12px] font-medium opacity-90">
              Average human score: {summary.average}% across 6 detectors
            </div>
          </div>
          <div className="font-mono font-semibold text-[32px] tracking-[-1.5px]">{summary.average}%</div>
        </div>
      )}

      {/* Detector cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {DET_ORDER.map(id => {
          const r = results?.[id]
          return (
            <div key={id} className="b-card-sm rounded-xl2 px-4 py-4 bg-paper3">
              <div className="flex items-start justify-between mb-2">
                <div className="eyebrow text-[9.5px] text-mute">{r?.name || id}</div>
                {r && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border-2 border-ink"
                    style={{ background: r.live ? 'var(--mint)' : 'var(--paper2)', color: r.live ? '#fff' : '#76726A' }}>
                    {r.live ? 'LIVE' : 'PREDICTED'}
                  </span>
                )}
              </div>
              <div className="font-mono font-semibold text-[28px] tracking-[-1.5px] leading-none mb-1"
                style={{ color: r ? col(r.score) : '#76726A' }}>
                {r ? `${r.score}%` : '—'}
              </div>
              <div className="font-semibold text-[11px]" style={{ color: r ? col(r.score) : '#76726A' }}>
                {r ? (running ? '…' : r.label) : 'Not scanned'}
              </div>
              {r && (
                <div className="mt-2.5 h-2 bg-paper border-2 border-ink rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-[1200ms]"
                    style={{ width:`${r.score}%`, background: col(r.score) }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {err && (
        <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[13px] font-medium mb-4">{err}</div>
      )}

      {/* Input */}
      <div className="b-card rounded-xl3 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink">
          <span className="eyebrow text-[10px] text-coral">Paste Text to Scan</span>
          <button onClick={run} disabled={running || !text.trim()}
            className="btn btn-primary px-4 py-2 text-[12px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
            {running
              ? <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>
                  Scanning…
                </span>
              : 'Run All 6 Detectors'}
          </button>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
          className="w-full bg-transparent text-ink text-[13.5px] leading-[1.72] font-body
            px-4 py-4 outline-none resize-none placeholder:text-mute"
          placeholder="Paste text — GhostWrite checks it across all 6 detectors simultaneously…" />
        <div className="px-4 py-2.5 border-t-2 border-ink bg-paper2 flex items-center gap-3 text-[11px] font-mono text-mute flex-wrap">
          <span><span className="inline-block w-2 h-2 rounded-full bg-mint mr-1.5 mb-[-1px]" /> LIVE = real API result</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-mute mr-1.5 mb-[-1px]" /> PREDICTED = statistical analysis (add API key in .env for live)</span>
        </div>
      </div>

      {/* Upgrade hint */}
      {summary && !summary.allPass && (
        <div className="mt-4 px-5 py-4 rounded-xl3 bg-sun border-2 border-ink shadow-b-sm flex items-center justify-between gap-4">
          <div>
            <div className="font-display font-semibold text-[14px] text-ink mb-1">Some detectors flagged this text</div>
            <div className="text-ink2 text-[12px] font-medium">
              Head back to the Humanizer and try <span className="font-bold">Hyper mode</span> to push your score higher. lock in.
            </div>
          </div>
          <a href="/dashboard/humanizer" className="btn btn-ink px-5 py-2.5 text-[12.5px] rounded-full whitespace-nowrap shrink-0">
            Re-humanize →
          </a>
        </div>
      )}
    </div>
  )
}
