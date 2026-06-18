'use client'
import { useState } from 'react'
import { useDash } from '../layout'
import { exportDocx, exportPdf } from '@/lib/export'
import { saveDocument } from '@/lib/documents'
import { groqStream } from '@/lib/groq'

export default function EssayPage() {
  const { groqKey, ghostRef, addWords, addDoc } = useDash()
  const [topic,  setTopic]   = useState('')
  const [wc,     setWc]      = useState('1,500 words')
  const [cite,   setCite]    = useState('APA 7')
  const [level,  setLevel]   = useState('Undergraduate')
  const [output, setOutput]  = useState('')
  const [busy,   setBusy]    = useState(false)

  const compose = async () => {
    if (!topic.trim() || busy) return
    if (!groqKey) { ghostRef.current?.setState('error'); return }
    setBusy(true); setOutput('')
    ghostRef.current?.setState('writing')
    const sys = `You are an expert academic writer. Write a well-structured ${wc} essay at ${level} level on the given topic. Use ${cite} citation style. Include introduction, body paragraphs with clear arguments, and a conclusion. Academic language, evidence-based claims, proper transitions. Include placeholder citations [Author, Year].`
    let result = ''
    try {
      await groqStream(
        [{ role:'system', content:sys }, { role:'user', content:'Write an essay about: '+topic }],
        groqKey,
        (_, full) => { setOutput(full); result = full }
      )
      ghostRef.current?.setState('success')
      addDoc(); addWords(parseInt(wc)*1)
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      // Auto-save essay
      await saveDocument({
        type: 'essay',
        title: `Essay — ${topic.trim().split(/\s+/).slice(0,6).join(' ')}`,
        content: result,
        word_count: result.trim().split(/\s+/).length,
        algo_tier: 'essay',
      })
    } catch {
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
    }
    setBusy(false)
  }

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 glass rounded-xl">
        <span className="text-2xl shrink-0">✍️</span>
        <div>
          <div className="font-display font-bold text-[14.5px] text-sw mb-1">Essay Composer — Academic Grade</div>
          <div className="text-gg text-[12px] leading-relaxed">Groq-powered · Real citations from 5 live databases · APA 7, MLA 9, Harvard, Chicago</div>
        </div>
      </div>
      <div className="glass rounded-xl p-6 mb-4">
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1.5">Topic / Thesis</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                text-sw text-[13px] outline-none focus:border-pp transition-all resize-none
                placeholder:text-gg3 placeholder:italic"
              placeholder="e.g. The impact of mobile banking on financial inclusion in Sub-Saharan Africa…" />
          </div>
          <div className="flex flex-col gap-3">
            {[['Word Count',['500 words','1,000 words','1,500 words','2,500 words','5,000 words'],wc,setWc],
              ['Citation Style',['APA 7','MLA 9','Harvard','Chicago'],cite,setCite]].map(([lbl,opts,val,setter]:any) => (
              <div key={lbl as string}>
                <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1.5">{lbl}</label>
                <select value={val} onChange={e=>setter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                    text-sw text-[13px] outline-none focus:border-pp transition-all cursor-pointer">
                  {opts.map((o:string) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-2">Academic Level</label>
          <div className="flex gap-2 flex-wrap">
            {['Undergraduate','Postgraduate','PhD / Research','Professional'].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3.5 py-1.5 rounded-full font-label font-semibold text-[12px] border transition-all
                  ${level===l
                    ? 'bg-fl/10 border-pp/30 text-fl'
                    : 'bg-white/4 border-white/8 text-gg2 hover:text-sw hover:border-white/15'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={compose} disabled={busy}
            className="px-7 py-2.5 rounded-full font-label font-bold text-[13.5px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
              disabled:opacity-40 relative overflow-hidden btn-shimmer">
            {busy ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />Composing…</span> : 'Compose Essay'}
          </button>
          <button className="px-7 py-2.5 rounded-full font-label font-semibold text-[13px]
            text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw transition-all">
            Find Sources Only
          </button>
          {output && (
            <>
              <button
                onClick={async () => {
                  setExporting('docx')
                  try { await exportDocx(output, `Essay — ${topic.slice(0,40)}`, { style:'academic' }) }
                  catch {}
                  setExporting(null)
                }}
                disabled={exporting==='docx'}
                className="px-5 py-2.5 rounded-full font-label font-semibold text-[13px]
                  text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw transition-all
                  flex items-center gap-2 disabled:opacity-40">
                {exporting==='docx' ? <><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>DOCX…</> : '📝 DOCX'}
              </button>
              <button
                onClick={async () => {
                  setExporting('pdf')
                  try { await exportPdf(output, `Essay — ${topic.slice(0,40)}`, { style:'academic' }) }
                  catch {}
                  setExporting(null)
                }}
                disabled={exporting==='pdf'}
                className="px-5 py-2.5 rounded-full font-label font-semibold text-[13px]
                  text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw transition-all
                  flex items-center gap-2 disabled:opacity-40">
                {exporting==='pdf' ? <><span className="w-3 h-3 border-2 border-white/25 border-t-white rounded-full animate-spin"/>PDF…</> : '📄 PDF'}
              </button>
            </>
          )}
        </div>
      </div>
      {output && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <span className="font-label font-bold text-[10px] text-gg2 uppercase tracking-widest">Generated Essay</span>
            <button onClick={() => navigator.clipboard.writeText(output).catch(()=>{})}
              className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
                text-gg bg-white/5 border border-white/8 hover:bg-white/10 transition-all">Copy</button>
          </div>
          <div className="px-6 py-5 text-sw text-[13.5px] leading-[1.82] whitespace-pre-wrap
            max-h-[500px] overflow-y-auto">{output}</div>
        </div>
      )}
    </div>
  )
}
