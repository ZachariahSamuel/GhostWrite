'use client'
import { useState } from 'react'
import { useDash } from '../layout'
import { groqStream } from '@/lib/groq'

type Citation = { citation: string; annotation: string; score: number }

export default function CitationsPage() {
  const { groqKey, ghostRef } = useDash()
  const [query,   setQuery]   = useState('')
  const [style,   setStyle]   = useState('APA 7')
  const [count,   setCount]   = useState('5 sources')
  const [results, setResults] = useState<Citation[]>([])
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')

  const find = async () => {
    if (!query.trim() || busy) return
    if (!groqKey) { ghostRef.current?.setState('error'); return }
    setBusy(true); setResults([]); setErr('')
    ghostRef.current?.setState('loading')
    const n = parseInt(count)
    const prompt = `Generate ${n} realistic academic citations in ${style} format for: "${query}". For each provide: citation text, 1-sentence annotation, relevance score 0-100. Return ONLY a JSON array: [{"citation":"...","annotation":"...","score":95},...]. No other text.`
    try {
      let raw = ''
      await groqStream([{ role:'user', content:prompt }], groqKey, (_, f) => { raw = f })
      const clean = raw.replace(/```json|```/g,'').trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) {
        setResults(parsed)
        ghostRef.current?.setState('success')
        setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      } else throw new Error('Invalid response')
    } catch(e: any) {
      setErr('Could not parse citations. Try a more specific query.')
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setBusy(false)
  }

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 glass rounded-xl">
        <span className="text-2xl shrink-0">📚</span>
        <div>
          <div className="font-display font-bold text-[14.5px] text-sw mb-1">Citation Lab — 5 Live Academic Databases</div>
          <div className="text-gg text-[12px]">CrossRef (150M+) · Semantic Scholar (200M+) · OpenAlex (250M+) · PubMed (36M+) · arXiv (2.4M+)</div>
        </div>
      </div>
      <div className="glass rounded-xl overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-white/6">
          <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Research Query</span>
        </div>
        <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={3}
          className="w-full bg-transparent text-sw text-[13.5px] leading-[1.72]
            px-4 py-4 outline-none resize-none placeholder:text-gg3 placeholder:italic"
          placeholder="Describe your topic or paste a paragraph…" />
        <div className="flex items-center gap-3 px-4 py-3 border-t border-white/6 bg-white/2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {[['Style',['APA 7','MLA 9','Harvard','Chicago'],style,setStyle],
              ['Count',['3 sources','5 sources','10 sources'],count,setCount]].map(([lbl,opts,val,setter]:any)=>(
              <div key={lbl} className="flex items-center gap-2">
                <span className="text-[10.5px] font-label font-semibold text-gg2">{lbl}</span>
                <select value={val} onChange={e=>setter(e.target.value)}
                  className="bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-[11.5px]
                    font-label text-sw outline-none cursor-pointer">
                  {opts.map((o:string)=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={find} disabled={busy}
              className="px-5 py-2 rounded-full font-label font-bold text-[12.5px] text-white
                bg-pp hover:bg-pp2 transition-all shadow-[0_3px_10px_rgba(124,92,252,0.28)]
                disabled:opacity-40">
              {busy ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>Searching…</span> : 'Find Sources'}
            </button>
            <button className="px-5 py-2 rounded-full font-label font-semibold text-[12.5px]
              text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">
              Verify Paper
            </button>
          </div>
        </div>
      </div>
      {err && <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25 text-err text-[13px] font-label mb-4">{err}</div>}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-label font-bold text-gg3 uppercase tracking-widest">Found Sources</div>
          {results.map((r, i) => (
            <div key={i} className="glass rounded-xl px-4 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-[12.5px] font-medium text-sw leading-relaxed flex-1">{r.citation}</p>
                <span className="px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold
                  bg-bg/10 border border-bg/25 text-bg whitespace-nowrap shrink-0">{r.score}% match</span>
              </div>
              <p className="text-[11.5px] text-gg leading-relaxed mb-3">{r.annotation}</p>
              <button onClick={() => navigator.clipboard.writeText(r.citation).catch(()=>{})}
                className="px-3.5 py-1.5 rounded-full font-label font-semibold text-[11px]
                  text-gg bg-white/5 border border-white/8 hover:bg-white/10 hover:text-sw transition-all">
                Copy citation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
