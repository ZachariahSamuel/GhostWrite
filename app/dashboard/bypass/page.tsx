'use client'
import { useState } from 'react'
import { useDash } from '../layout'

type DetResult = { score: number; label: string; live: boolean; name: string }
type Results   = Record<string, DetResult>

const DET_ORDER = ['turnitin','gptzero','originality','copyleaks','zerogpt','sapling']

const col = (v: number) =>
  v >= 80 ? '#10B981' : v >= 60 ? '#F59E0B' : '#EF4444'

export default function BypassPage() {
  const { groqKey, ghostRef } = useDash()
  const [text,    setText]    = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [summary, setSummary] = useState<{ average:number; allPass:boolean; verdict:string } | null>(null)
  const [running, setRunning] = useState(false)
  const [err,     setErr]     = useState('')

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
    <div className="animate-fade-up">

      {/* Summary banner */}
      {summary && (
        <div className={`flex items-center justify-between px-5 py-4 rounded-xl mb-5 border
          ${summary.allPass
            ? 'bg-bg/8 border-bg/25'
            : summary.average >= 70 ? 'bg-wa/8 border-wa/25' : 'bg-err/8 border-err/25'}`}>
          <div>
            <div className={`font-mono font-semibold text-[13px] mb-0.5
              ${summary.allPass ? 'text-bg' : summary.average >= 70 ? 'text-wa' : 'text-err'}`}>
              {summary.verdict}
            </div>
            <div className="text-gg text-[12px] font-label">
              Average human score: {summary.average}% across 6 detectors
            </div>
          </div>
          <div className="font-mono font-semibold text-[32px] tracking-[-1.5px]"
            style={{ color: col(summary.average) }}>
            {summary.average}%
          </div>
        </div>
      )}

      {/* Detector cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        {DET_ORDER.map(id => {
          const r = results?.[id]
          return (
            <div key={id} className="glass rounded-xl px-4 py-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px
                bg-gradient-to-r from-transparent via-pp/15 to-transparent" />
              <div className="flex items-start justify-between mb-2">
                <div className="font-label font-semibold text-[9.5px] text-gg3 uppercase tracking-widest">
                  {r?.name || id}
                </div>
                {r && (
                  <span className={`text-[9px] font-label font-bold px-1.5 py-0.5 rounded-full border
                    ${r.live
                      ? 'bg-bg/10 border-bg/25 text-bg'
                      : 'bg-white/5 border-white/8 text-gg3'}`}>
                    {r.live ? 'LIVE' : 'PREDICTED'}
                  </span>
                )}
              </div>
              <div className="font-mono font-semibold text-[28px] tracking-[-1.5px] leading-none mb-1"
                style={{ color: r ? col(r.score) : 'var(--gg3)' }}>
                {r ? `${r.score}%` : '—'}
              </div>
              <div className="font-label font-semibold text-[11px]"
                style={{ color: r ? col(r.score) : 'var(--gg3)' }}>
                {r ? (running ? '…' : r.label) : 'Not scanned'}
              </div>
              {/* Score bar */}
              {r && (
                <div className="mt-2.5 h-[2px] bg-white/6 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-[1200ms]"
                    style={{ width:`${r.score}%`, background: col(r.score) }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {err && (
        <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25
          text-err text-[13px] font-label mb-4">{err}</div>
      )}

      {/* Input */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">
            Paste Text to Scan
          </span>
          <button onClick={run} disabled={running || !text.trim()}
            className="px-4 py-2 rounded-full font-label font-bold text-[12px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.28)]
              disabled:opacity-40 disabled:cursor-not-allowed">
            {running
              ? <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>
                  Scanning…
                </span>
              : 'Run All 6 Detectors'}
          </button>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6}
          className="w-full bg-transparent text-sw text-[13.5px] leading-[1.72]
            px-4 py-4 outline-none resize-none placeholder:text-gg3 placeholder:italic"
          placeholder="Paste text — GhostWrite checks it across all 6 detectors simultaneously…" />
        <div className="px-4 py-2.5 border-t border-white/6 bg-white/2
          flex items-center gap-3 text-[11px] font-label text-gg3">
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-bg mr-1.5 mb-[-1px]" />
            LIVE = real API result
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-white/20 mr-1.5 mb-[-1px]" />
            PREDICTED = statistical analysis (add API key in .env for live)
          </span>
        </div>
      </div>

      {/* Upgrade hint if text failed */}
      {summary && !summary.allPass && (
        <div className="mt-4 px-5 py-4 rounded-xl bg-pp/6 border border-pp/20 flex items-center justify-between gap-4">
          <div>
            <div className="font-label font-bold text-[13px] text-sw mb-1">
              Some detectors flagged this text
            </div>
            <div className="text-gg text-[12px]">
              Go back to the Humanizer and switch to <span className="text-pp2 font-semibold">Hyper mode ⚡</span> for 99.4% bypass
            </div>
          </div>
          <a href="/dashboard/humanizer"
            className="px-5 py-2.5 rounded-full font-label font-bold text-[12.5px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.28)] whitespace-nowrap shrink-0">
            Re-humanize →
          </a>
        </div>
      )}
    </div>
  )
}
