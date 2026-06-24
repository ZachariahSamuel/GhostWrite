'use client'
import { useEffect, useState } from 'react'
import { fetchDocuments } from '@/lib/documents'

type Doc = {
  type: string; word_count: number; bypass_score: Record<string, number> | null; created_at: string
}

const TOOL_META: Record<string, { label: string; color: string }> = {
  humanized: { label: 'Humanizer',      color: '#2B44FF' },
  essay:     { label: 'Essay Composer', color: '#14C98A' },
  detection: { label: 'Bypass Checks',  color: '#FFC53D' },
  citation:  { label: 'Citation Lab',   color: '#FF4D3D' },
}

function docAvg(scores: Record<string, number> | null): number | null {
  if (!scores) return null
  const vals = Object.values(scores).filter(v => typeof v === 'number')
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export default function AnalyticsPage() {
  const [docs, setDocs]       = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments({ limit: 200 }).then(d => { setDocs(d); setLoading(false) })
  }, [])

  const totalWords = docs.reduce((s, d) => s + (d.word_count || 0), 0)
  const bypassVals = docs.map(d => docAvg(d.bypass_score)).filter((v): v is number => v !== null)
  const avgBypass  = bypassVals.length ? Math.round(bypassVals.reduce((a, b) => a + b, 0) / bypassVals.length) : null

  const byType: Record<string, number> = {}
  for (const d of docs) byType[d.type] = (byType[d.type] || 0) + (d.word_count || 0)
  const tools = Object.keys(TOOL_META).map(type => ({
    ...TOOL_META[type],
    words: byType[type] || 0,
    pct: totalWords > 0 ? Math.round(((byType[type] || 0) / totalWords) * 100) : 0,
  })).sort((a, b) => b.words - a.words)

  const stats = [
    { lbl: 'Total Words',  val: loading ? '—' : totalWords.toLocaleString(), sub: 'All saved documents', bg: 'var(--paper3)', fg: '#1A1A17' },
    { lbl: 'Avg. Bypass',  val: loading ? '—' : (avgBypass !== null ? `${avgBypass}%` : '—'), sub: avgBypass !== null ? 'Across scored docs' : 'No scored docs yet', bg: avgBypass !== null && avgBypass >= 80 ? 'var(--mint)' : 'var(--paper3)', fg: avgBypass !== null && avgBypass >= 80 ? '#fff' : '#1A1A17' },
    { lbl: 'Documents',    val: loading ? '—' : String(docs.length), sub: 'Saved to your library', bg: 'var(--blue)', fg: '#fff' },
  ]

  return (
    <div className="animate-fade-up max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.lbl} className="b-card rounded-xl3 px-5 py-5" style={{ background: s.bg, color: s.fg }}>
            <div className="eyebrow text-[9.5px] mb-2 opacity-70">{s.lbl}</div>
            {loading
              ? <div className="skeleton h-7 w-20 mb-1.5" />
              : <div className="font-mono font-semibold text-[26px] tracking-tight leading-none mb-1.5">{s.val}</div>}
            <div className="text-[11px] font-medium opacity-75">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="b-card rounded-xl3 p-6">
        <div className="eyebrow text-[11px] text-coral mb-5">Words by Tool</div>
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
          </div>
        ) : totalWords === 0 ? (
          <div className="text-center py-6">
            <p className="text-ink2 text-[13px] mb-4 font-medium">No usage yet — your stats pull up here as you cook. lock in.</p>
            <a href="/dashboard/humanizer" className="btn btn-primary inline-flex px-6 py-2.5 text-[13px] rounded-full">
              Start humanizing →
            </a>
          </div>
        ) : (
          tools.map(t => (
            <div key={t.label} className="flex items-center gap-3 mb-4 last:mb-0">
              <span className="font-medium text-[12px] text-ink2 w-36 shrink-0">{t.label}</span>
              <div className="flex-1 h-3 bg-paper border-2 border-ink rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-[1200ms]"
                  style={{ width: `${t.pct}%`, background: t.color }} />
              </div>
              <span className="font-mono text-[12px] font-semibold text-ink w-9 text-right">{t.pct}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
