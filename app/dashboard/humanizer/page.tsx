'use client'
import { useState, useEffect } from 'react'
import { useDash } from '../layout'
import { saveDocument } from '@/lib/documents'
import { exportDocx, exportPdf } from '@/lib/export'
import { Dna, Page, PageFlip, Download, NavArrowDown } from 'iconoir-react'
import LiveDetectorGauge from '@/components/ghost/LiveDetectorGauge'
import { analyzeText, type ScoreResult } from '@/lib/detector-score'

const DEMO = `Artificial intelligence represents a transformative technological advancement that is fundamentally altering the landscape of multiple industries. The implementation of machine learning algorithms has demonstrated significant efficacy in processing vast quantities of data with unprecedented speed and accuracy. Furthermore, the integration of natural language processing capabilities has enabled the development of sophisticated conversational interfaces that facilitate human-computer interaction in increasingly naturalistic ways.`

// score → riso colour
const sc = (n: number) => (n >= 80 ? '#14C98A' : n >= 50 ? '#E5A200' : '#FF4D3D')

export default function HumanizerPage() {
  const { algo, groqKey, ghostRef, addWords, addDoc } = useDash()
  const [input,   setInput]   = useState('')
  const [output,  setOutput]  = useState('')
  const [stream,  setStream]  = useState('')
  const [busy,    setBusy]    = useState(false)
  const [speed,   setSpeed]   = useState('—')
  const [style,   setStyle]   = useState('academic')
  const [tone,    setTone]    = useState('formal')
  const [saved,   setSaved]   = useState(false)
  const [exporting,setExporting]= useState<'docx'|'pdf'|null>(null)
  const [useDna,  setUseDna]  = useState(true)
  const [err,     setErr]     = useState('')

  const [inAnalysis,  setInAnalysis]  = useState<ScoreResult>(() => analyzeText(''))
  const [typing,      setTyping]      = useState(false)
  const [outAnalysis, setOutAnalysis] = useState<ScoreResult | null>(null)
  useEffect(() => {
    setTyping(true)
    const t = setTimeout(() => { setInAnalysis(analyzeText(input)); setTyping(false) }, 220)
    return () => clearTimeout(t)
  }, [input])

  const wc = input.trim() ? input.trim().split(/\s+/).length : 0

  const doHumanize = async () => {
    if (busy || !input.trim()) return
    if (!groqKey) { ghostRef.current?.setState('error'); setErr('Add your Groq API key first — use the key icon in the top bar'); return }

    setBusy(true); setOutput(''); setStream(''); setOutAnalysis(null); setErr(''); setSaved(false)
    ghostRef.current?.setState('writing')

    const t0 = Date.now()

    const res = await fetch('/api/humanize', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({ text: input, algo, style, tone, useDna }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg  = (data as any).error || 'Humanization failed'
      setErr(msg); setBusy(false)
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      return
    }

    const reader = res.body!.getReader()
    const dec    = new TextDecoder()
    let full     = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = dec.decode(value).split('\n')
        .filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')
      for (const line of lines) {
        try {
          const d     = JSON.parse(line.slice(6))
          const chunk = d.choices?.[0]?.delta?.content || ''
          if (chunk) { full += chunk; setStream(full) }
        } catch {}
      }
    }

    const elapsed  = ((Date.now()-t0)/1000).toFixed(1)+'s'
    const outWords = full.trim().split(/\s+/).length

    setOutput(full); setStream(''); setSpeed(elapsed)
    addWords(outWords); addDoc()
    ghostRef.current?.setState('success')
    setTimeout(() => ghostRef.current?.setState('idle'), 2200)

    const outScore = analyzeText(full)
    setOutAnalysis(outScore)

    const title = input.trim().split(/\s+/).slice(0,8).join(' ') + '…'
    const didSave = await saveDocument({
      type:         'humanized',
      title,
      content:      full,
      word_count:   outWords,
      algo_tier:    algo,
      bypass_score: { human: outScore.humanScore },
    })
    if (didSave) setSaved(true)

    setBusy(false)
  }

  const copyOut = () => { if (output) navigator.clipboard.writeText(output).catch(() => {}) }

  const STATS = [
    { lbl:'Human score', val: outAnalysis ? `${outAnalysis.humanScore}%` : '—', bg:'var(--mint)', fg:'#fff' },
    { lbl:'Words',       val: output ? output.trim().split(/\s+/).length.toLocaleString() : '—', bg:'var(--paper3)', fg:'#1A1A17' },
    { lbl:'Speed',       val: speed, bg:'var(--paper3)', fg:'#1A1A17' },
    { lbl:'Engine',      val: 'Llama 3.3 70B', bg:'var(--blue)', fg:'#fff', small:true },
  ]

  return (
    <div className="animate-fade-up max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {STATS.map(s => (
          <div key={s.lbl} className="b-card-sm rounded-xl2 px-4 py-4" style={{ background: s.bg, color: s.fg }}>
            <div className="eyebrow text-[9.5px] mb-2 opacity-70">{s.lbl}</div>
            <div className={`font-mono font-semibold leading-none ${s.small ? 'text-[13px]' : 'text-[22px] tracking-tight'}`}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {err && (
        <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[13px] font-medium mb-4">{err}</div>
      )}

      {/* IO panels */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Input */}
        <div className="b-card rounded-xl3 flex flex-col" style={{ minHeight:'300px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink shrink-0">
            <span className="eyebrow text-[10px] text-coral">AI Text — Input</span>
            <div className="flex gap-2">
              <button onClick={() => { setInput(''); setOutput(''); setOutAnalysis(null); setSaved(false) }}
                className="btn btn-ghost px-3 py-1 text-[11px] rounded-full border-2 border-ink">Clear</button>
              <button onClick={() => setInput(DEMO)}
                className="btn btn-ghost px-3 py-1 text-[11px] rounded-full border-2 border-ink">Demo</button>
            </div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-ink text-[13.5px] leading-[1.72] font-body
              px-4 py-4 outline-none resize-none placeholder:text-mute"
            placeholder="Paste your mid AI text here — up to 5,000 words…" />
          <div className="flex items-center gap-2 px-4 py-2.5 border-t-2 border-ink bg-paper2 shrink-0 flex-wrap rounded-b-xl3">
            <select value={style} onChange={e=>setStyle(e.target.value)}
              className="bg-paper border-2 border-ink rounded-full px-3 py-1.5 text-[11.5px] font-mono text-ink outline-none cursor-pointer">
              {['academic','professional','casual','creative','journalistic'].map(s=>(
                <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>
              ))}
            </select>
            <select value={tone} onChange={e=>setTone(e.target.value)}
              className="bg-paper border-2 border-ink rounded-full px-3 py-1.5 text-[11.5px] font-mono text-ink outline-none cursor-pointer">
              {['formal','semi-formal','informal'].map(t=>(
                <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>
              ))}
            </select>
            <span className="ml-auto flex items-center gap-2">
              {inAnalysis.verdict !== 'insufficient' && (
                <span className="font-mono text-[10.5px] px-2.5 py-1 rounded-full border-2 border-ink flex items-center gap-1.5"
                  style={{ color: sc(inAnalysis.humanScore) }}>
                  {typing && <span className="w-1.5 h-1.5 rounded-full bg-current animate-gauge-pulse" />}
                  {inAnalysis.humanScore}% human
                </span>
              )}
              <span className="font-mono text-[10.5px] text-ink2 bg-paper border-2 border-ink px-2.5 py-1 rounded-full">{wc}w</span>
            </span>
          </div>
        </div>

        {/* Output */}
        <div className="b-card rounded-xl3 flex flex-col" style={{ minHeight:'300px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink shrink-0">
            <div className="flex items-center gap-2">
              <span className="eyebrow text-[10px] text-blue">Output — Invisible</span>
              {saved && (
                <span className="px-2 py-0.5 rounded-full font-mono font-semibold text-[9.5px] bg-mint text-white border-2 border-ink">✓ Saved</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={copyOut}
                className="btn btn-ghost px-3 py-1 text-[11px] rounded-full border-2 border-ink">Copy</button>
              <a href="/dashboard/bypass" className="btn btn-primary px-3 py-1 text-[11px] rounded-full">Check</a>
            </div>
          </div>
          {busy && stream && (
            <div className="mx-4 mt-3 rounded-xl2 bg-blue/10 border-2 border-ink p-3 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="eyebrow text-[9.5px] text-blue">Casper is writing…</span>
                <span className="w-2 h-2 rounded-full bg-blue animate-pulse" />
              </div>
              <p className="text-[12px] text-ink2 leading-relaxed line-clamp-3">{stream}</p>
            </div>
          )}
          <textarea readOnly value={output}
            className="flex-1 bg-transparent text-ink text-[13.5px] leading-[1.72] font-body
              px-4 py-4 outline-none resize-none placeholder:text-mute"
            placeholder="Your output drops here — clean, human, ready to ship…" />
          {output && !busy && (
            <div className="px-4 pb-4 shrink-0 flex items-center gap-2 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full" style={{ background: sc(inAnalysis.humanScore) }} />
              <span className="text-ink2">Live input score: <span className="text-ink font-semibold">{inAnalysis.verdict === 'insufficient' ? '—' : `${inAnalysis.humanScore}%`}</span></span>
              <span className="ml-auto text-blue font-semibold">See full radar ↓</span>
            </div>
          )}
        </div>
      </div>

      {/* Before → after */}
      {outAnalysis && (
        <div className="b-card rounded-xl3 p-5 md:p-6 mb-4">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="eyebrow text-[10px] text-blue mb-1">Bypass result · scored live</div>
              <h3 className="font-display font-semibold text-[20px] text-ink tracking-[-0.01em]">Before → After</h3>
            </div>
            {(() => {
              const delta = outAnalysis.humanScore - (inAnalysis.verdict === 'insufficient' ? 0 : inAnalysis.humanScore)
              return (
                <div className="px-4 py-2 rounded-xl2 border-2 border-ink font-mono font-semibold text-[15px] text-white"
                  style={{ background: delta >= 0 ? 'var(--mint)' : 'var(--coral)' }}>
                  {delta >= 0 ? '+' : ''}{delta} human score
                </div>
              )
            })()}
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="flex flex-col items-center">
              <span className="eyebrow text-[10px] text-mute mb-3">Original AI text</span>
              <LiveDetectorGauge score={inAnalysis.humanScore} verdict={inAnalysis.verdict} size={172} />
            </div>
            <div className="flex flex-col items-center">
              <span className="eyebrow text-[10px] text-mint mb-3">After GhostWrite</span>
              <LiveDetectorGauge
                score={outAnalysis.humanScore} verdict={outAnalysis.verdict}
                signals={outAnalysis.signals} tip={outAnalysis.weakest?.hint} size={172} />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button onClick={() => setUseDna(v => !v)} aria-pressed={useDna}
          title={useDna ? 'Writing DNA on — your voice fingerprint is applied' : 'Writing DNA off'}
          className={`btn inline-flex items-center gap-2 px-5 py-2.5 text-[13px] rounded-full border-2 border-ink
            ${useDna ? 'bg-sun text-ink' : 'bg-paper3 text-ink2 hover:bg-paper2'}`}>
          <Dna className="w-4 h-4" aria-hidden /> Writing DNA
          <span className="ml-1 text-[10px] font-bold font-mono">{useDna ? 'ON' : 'OFF'}</span>
        </button>
        <button onClick={doHumanize} disabled={busy}
          className="btn btn-coral px-12 py-3 text-[14px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
          {busy
            ? <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                Making invisible…
              </span>
            : 'Make It Invisible'}
        </button>
        <div className="relative group">
          <button disabled={!output}
            className="btn btn-ghost px-5 py-2.5 text-[13px] rounded-full border-2 border-ink
              disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
            <Download className="w-4 h-4" aria-hidden /> Export
            <NavArrowDown className="w-3 h-3 opacity-60" aria-hidden />
          </button>
          {output && (
            <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[150px] b-card rounded-xl2
              overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
              <button
                onClick={async () => {
                  if (!output) return
                  setExporting('docx')
                  try { const t = input.trim().split(/\s+/).slice(0,6).join(' '); await exportDocx(output, t, { algo, style, tone }) }
                  catch(e: any) { setErr(e.message) }
                  setExporting(null)
                }}
                disabled={exporting==='docx'}
                className="w-full px-4 py-2.5 text-left font-medium text-[12px] text-ink hover:bg-paper2 transition-all flex items-center gap-2">
                {exporting==='docx'
                  ? <><span className="w-3 h-3 border-2 border-ink/25 border-t-ink rounded-full animate-spin"/>Exporting…</>
                  : <><Page className="w-4 h-4" aria-hidden /> Download DOCX</>}
              </button>
              <div className="h-0.5 bg-ink/15" />
              <button
                onClick={async () => {
                  if (!output) return
                  setExporting('pdf')
                  try { const t = input.trim().split(/\s+/).slice(0,6).join(' '); await exportPdf(output, t, { algo, style, tone }) }
                  catch(e: any) { setErr(e.message) }
                  setExporting(null)
                }}
                disabled={exporting==='pdf'}
                className="w-full px-4 py-2.5 text-left font-medium text-[12px] text-ink hover:bg-paper2 transition-all flex items-center gap-2">
                {exporting==='pdf'
                  ? <><span className="w-3 h-3 border-2 border-ink/25 border-t-ink rounded-full animate-spin"/>Exporting…</>
                  : <><PageFlip className="w-4 h-4" aria-hidden /> Download PDF</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
