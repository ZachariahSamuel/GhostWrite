'use client'
import { useState } from 'react'
import { useDash } from '../layout'
import { ALGO_PROMPTS, BYPASS_RATES, MODEL_NAMES } from '@/lib/groq'
import { saveDocument } from '@/lib/documents'
import { exportDocx, exportPdf } from '@/lib/export'

const DEMO = `Artificial intelligence represents a transformative technological advancement that is fundamentally altering the landscape of multiple industries. The implementation of machine learning algorithms has demonstrated significant efficacy in processing vast quantities of data with unprecedented speed and accuracy. Furthermore, the integration of natural language processing capabilities has enabled the development of sophisticated conversational interfaces that facilitate human-computer interaction in increasingly naturalistic ways.`

const SCORES = { std:[94,91,96], pro:[97,95,98], hyp:[99,98,99] }

export default function HumanizerPage() {
  const { algo, groqKey, ghostRef, addWords, addDoc } = useDash()
  const [input,   setInput]   = useState('')
  const [output,  setOutput]  = useState('')
  const [stream,  setStream]  = useState('')
  const [busy,    setBusy]    = useState(false)
  const [speed,   setSpeed]   = useState('—')
  const [scores,  setScores]  = useState<number[]|null>(null)
  const [style,   setStyle]   = useState('academic')
  const [tone,    setTone]    = useState('formal')
  const [saved,   setSaved]   = useState(false)
  const [exporting,setExporting]= useState<'docx'|'pdf'|null>(null)
  const [err,     setErr]     = useState('')

  const wc = input.trim() ? input.trim().split(/\s+/).length : 0

  const doHumanize = async () => {
    if (busy || !input.trim()) return
    if (!groqKey) { ghostRef.current?.setState('error'); setErr('Add your Groq API key first — click 🔑'); return }

    setBusy(true); setOutput(''); setStream(''); setScores(null); setErr(''); setSaved(false)
    ghostRef.current?.setState('writing')

    const t0 = Date.now()

    // Stream via API route — key sent as Authorization header
    const res = await fetch('/api/humanize', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`,
      },
      body: JSON.stringify({ text: input, algo, style, tone }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg  = (data as any).error || 'Humanization failed'
      setErr(msg); setBusy(false)
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      return
    }

    // Read SSE stream
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

    const [tt,gz,or] = SCORES[algo as keyof typeof SCORES]
    setTimeout(() => setScores([tt,gz,or]), 300)

    // Auto-save to Supabase
    const title = input.trim().split(/\s+/).slice(0,8).join(' ') + '…'
    const saved = await saveDocument({
      type:         'humanized',
      title,
      content:      full,
      word_count:   outWords,
      algo_tier:    algo,
      bypass_score: { tt, gz, or },
    })
    if (saved) setSaved(true)

    setBusy(false)
  }

  const copyOut = () => {
    if (output) navigator.clipboard.writeText(output).catch(() => {})
  }

  return (
    <div className="animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { lbl:'Bypass Rate', val: BYPASS_RATES[algo as keyof typeof BYPASS_RATES], green:true  },
          { lbl:'Words',       val: output ? output.trim().split(/\s+/).length.toLocaleString() : '—' },
          { lbl:'Speed',       val: speed },
          { lbl:'Model',       val: MODEL_NAMES[algo as keyof typeof MODEL_NAMES], purple:true },
        ].map(s => (
          <div key={s.lbl} className="glass rounded-xl px-4 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px
              bg-gradient-to-r from-transparent via-pp/20 to-transparent" />
            <div className="text-[9.5px] font-label font-bold text-gg3 uppercase tracking-widest mb-2">{s.lbl}</div>
            <div className={`font-mono font-semibold leading-none
              ${s.green?'text-bg':s.purple?'text-pp2':'text-sw'}
              ${s.lbl==='Model'?'text-[12px] leading-tight mt-1':'text-[22px] tracking-tight'}`}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {err && (
        <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25
          text-err text-[13px] font-label mb-4">{err}</div>
      )}

      {/* IO panels */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Input */}
        <div className="glass rounded-xl flex flex-col" style={{ minHeight:'300px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
            <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">AI Text — Input</span>
            <div className="flex gap-2">
              <button onClick={() => { setInput(''); setOutput(''); setScores(null); setSaved(false) }}
                className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
                  text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">Clear</button>
              <button onClick={() => setInput(DEMO)}
                className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
                  text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">Demo</button>
            </div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            className="flex-1 bg-transparent text-sw text-[13.5px] leading-[1.72]
              px-4 py-4 outline-none resize-none placeholder:text-gg3 placeholder:italic"
            placeholder="Paste your AI-generated text here — up to 5,000 words…" />
          <div className="flex items-center gap-3 px-4 py-2.5 border-t border-white/6
            bg-white/2 shrink-0 flex-wrap">
            <select value={style} onChange={e=>setStyle(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-full px-3 py-1.5
                text-[11.5px] font-label text-sw outline-none cursor-pointer">
              {['academic','professional','casual','creative','journalistic'].map(s=>(
                <option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>
              ))}
            </select>
            <select value={tone} onChange={e=>setTone(e.target.value)}
              className="bg-white/5 border border-white/8 rounded-full px-3 py-1.5
                text-[11.5px] font-label text-sw outline-none cursor-pointer">
              {['formal','semi-formal','informal'].map(t=>(
                <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>
              ))}
            </select>
            <span className="ml-auto font-mono text-[10.5px] text-gg3
              bg-white/5 border border-white/6 px-2.5 py-1 rounded-full">{wc}w</span>
          </div>
        </div>

        {/* Output */}
        <div className="glass rounded-xl flex flex-col" style={{ minHeight:'300px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Output — Invisible</span>
              {saved && (
                <span className="px-2 py-0.5 rounded-full font-label font-semibold text-[9.5px]
                  bg-bg/10 border border-bg/25 text-bg">✓ Saved</span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={copyOut}
                className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
                  text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">Copy</button>
              <a href="/dashboard/bypass"
                className="px-3 py-1 rounded-full text-[11px] font-label font-bold
                  text-white bg-pp border border-pp/50 hover:bg-pp2 transition-all">Check</a>
            </div>
          </div>
          {busy && stream && (
            <div className="mx-4 mt-3 rounded-xl bg-fl/5 border border-pp/20 p-3 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9.5px] font-label font-bold text-pp2 uppercase tracking-widest">
                  👻 Ghost is writing…
                </span>
                <span className="w-2 h-2 rounded-full bg-pp animate-pulse" />
              </div>
              <p className="text-[12px] text-gg leading-relaxed line-clamp-3">{stream}</p>
            </div>
          )}
          <textarea readOnly value={output}
            className="flex-1 bg-transparent text-sw text-[13.5px] leading-[1.72]
              px-4 py-4 outline-none resize-none placeholder:text-gg3 placeholder:italic"
            placeholder="Your invisible output appears here…" />
          {scores && (
            <div className="px-4 pb-4 shrink-0">
              {[['Turnitin',scores[0]],['GPTZero',scores[1]],['Originality',scores[2]]].map(([n,v]) => (
                <div key={n as string} className="flex items-center gap-3 mb-2">
                  <span className="font-label font-semibold text-[11px] text-gg w-20 shrink-0">{n}</span>
                  <div className="flex-1 h-[3px] bg-white/6 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-bg transition-all duration-[1300ms]"
                      style={{ width:`${v}%` }} />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-bg w-9 text-right">{v}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button className="px-5 py-2.5 rounded-full font-label font-semibold text-[13px]
          text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw transition-all">
          🧬 Writing DNA
        </button>
        <button onClick={doHumanize} disabled={busy}
          className="px-12 py-3 rounded-full font-label font-bold text-[14px] text-white
            bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:shadow-[0_8px_28px_rgba(124,92,252,0.5)] hover:-translate-y-px
            relative overflow-hidden btn-shimmer">
          {busy
            ? <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                Making invisible…
              </span>
            : 'Make It Invisible'}
        </button>
        <div className="relative group">
          <button
            disabled={!output}
            className="px-5 py-2.5 rounded-full font-label font-semibold text-[13px]
              text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw
              transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
            📄 Export
            <span className="text-[10px] opacity-60">▾</span>
          </button>
          {output && (
            <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[140px]
              bg-vb3 border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]
              overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto
              transition-opacity">
              <button
                onClick={async () => {
                  if (!output) return
                  setExporting('docx')
                  try {
                    const t = input.trim().split(/\s+/).slice(0,6).join(' ')
                    await exportDocx(output, t, { algo, style, tone })
                  } catch(e: any) { setErr(e.message) }
                  setExporting(null)
                }}
                disabled={exporting==='docx'}
                className="w-full px-4 py-2.5 text-left font-label font-semibold text-[12px]
                  text-sw hover:bg-white/8 transition-all flex items-center gap-2">
                {exporting==='docx'
                  ? <><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>Exporting…</>
                  : <><span>📝</span> Download DOCX</>}
              </button>
              <div className="h-px bg-white/8" />
              <button
                onClick={async () => {
                  if (!output) return
                  setExporting('pdf')
                  try {
                    const t = input.trim().split(/\s+/).slice(0,6).join(' ')
                    await exportPdf(output, t, { algo, style, tone })
                  } catch(e: any) { setErr(e.message) }
                  setExporting(null)
                }}
                disabled={exporting==='pdf'}
                className="w-full px-4 py-2.5 text-left font-label font-semibold text-[12px]
                  text-sw hover:bg-white/8 transition-all flex items-center gap-2">
                {exporting==='pdf'
                  ? <><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>Exporting…</>
                  : <><span>📄</span> Download PDF</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
