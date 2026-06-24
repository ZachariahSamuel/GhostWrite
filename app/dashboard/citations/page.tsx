'use client'
import { useState } from 'react'
import { OpenBook, OpenNewWindow, Copy, CheckCircle } from 'iconoir-react'
import { useDash } from '../layout'

type Citation = {
  citation: string; annotation: string; score: number
  doi: string | null; url: string | null; year: number | null
}

export default function CitationsPage() {
  const { ghostRef } = useDash()
  const [query,   setQuery]   = useState('')
  const [style,   setStyle]   = useState('APA 7')
  const [count,   setCount]   = useState('5 sources')
  const [results, setResults] = useState<Citation[]>([])
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  const [copied,  setCopied]  = useState<number | null>(null)

  const find = async () => {
    if (!query.trim() || busy) return
    setBusy(true); setResults([]); setErr('')
    ghostRef.current?.setState('loading')
    try {
      const res = await fetch('/api/citations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, style, count: parseInt(count) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Search failed.')
        ghostRef.current?.setState('error')
        setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      } else {
        setResults(data.citations || [])
        ghostRef.current?.setState('success')
        setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      }
    } catch {
      setErr('Network error. Please try again.')
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setBusy(false)
  }

  const copy = (i: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(i); setTimeout(() => setCopied(null), 1600)
    }).catch(() => {})
  }

  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 b-card rounded-xl3">
        <span className="w-11 h-11 rounded-xl2 bg-blue border-2 border-ink shadow-b-xs flex items-center justify-center shrink-0">
          <OpenBook className="w-5 h-5" color="#fff" aria-hidden />
        </span>
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-display font-semibold text-[15px] text-ink">Citation Lab</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-semibold
              text-[9.5px] bg-mint text-white border-2 border-ink">
              <CheckCircle className="w-3 h-3" color="#fff" aria-hidden /> Real · DOI-verified
            </span>
          </div>
          <div className="text-ink2 text-[12px] font-medium">
            Live results from CrossRef — 150M+ real scholarly works. Every citation links to a verifiable DOI. no made-up papers, no cap.
          </div>
        </div>
      </div>

      <div className="b-card rounded-xl3 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b-2 border-ink">
          <label htmlFor="cite-query" className="eyebrow text-[10px] text-coral">Research Query</label>
        </div>
        <textarea id="cite-query" value={query} onChange={e=>setQuery(e.target.value)} rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) find() }}
          className="w-full bg-transparent text-ink text-[13.5px] leading-[1.72] font-body
            px-4 py-4 outline-none resize-none placeholder:text-mute"
          placeholder="Describe your topic — e.g. mobile banking and financial inclusion in Sub-Saharan Africa…" />
        <div className="flex items-center gap-3 px-4 py-3 border-t-2 border-ink bg-paper2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[['Style',['APA 7','MLA 9','Harvard','Chicago'],style,setStyle],
              ['Count',['3 sources','5 sources','10 sources'],count,setCount]].map(([lbl,opts,val,setter]:any)=>(
              <div key={lbl} className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono font-semibold text-mute">{lbl}</span>
                <select value={val} onChange={e=>setter(e.target.value)}
                  className="bg-paper border-2 border-ink rounded-full px-3 py-1.5 text-[11.5px] font-mono text-ink outline-none cursor-pointer">
                  {opts.map((o:string)=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={find} disabled={busy || !query.trim()}
              className="btn btn-primary px-5 py-2 text-[12.5px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
              {busy ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>Searching…</span> : 'Find Sources'}
            </button>
          </div>
        </div>
      </div>

      {err && <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[13px] font-medium mb-4">{err}</div>}

      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="eyebrow text-[11px] text-mute">
            {results.length} verified source{results.length > 1 ? 's' : ''}
          </div>
          {results.map((r, i) => (
            <div key={i} className="b-card rounded-xl3 px-4 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-[12.5px] font-medium text-ink leading-relaxed flex-1">{r.citation}</p>
                <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold
                  bg-mint text-white border-2 border-ink whitespace-nowrap shrink-0">{r.score}% match</span>
              </div>
              <p className="text-[11.5px] text-ink2 leading-relaxed mb-3">{r.annotation}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => copy(i, r.citation)}
                  className="btn btn-ghost inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] rounded-full border-2 border-ink">
                  <Copy className="w-3 h-3" aria-hidden /> {copied === i ? 'Copied' : 'Copy'}
                </button>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] rounded-full border-2 border-ink bg-blue text-white">
                    <OpenNewWindow className="w-3 h-3" aria-hidden /> View DOI
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
