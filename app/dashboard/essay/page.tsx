'use client'
import { useState } from 'react'
import { EditPencil, Page, PageFlip } from 'iconoir-react'
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
  const [exporting, setExporting] = useState<'docx'|'pdf'|null>(null)

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

  const inputCls = "w-full bg-paper border-2 border-ink rounded-xl2 px-4 py-3 text-ink text-[13px] outline-none focus:bg-paper3 transition-colors resize-none placeholder:text-mute font-body"

  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 b-card rounded-xl3">
        <span className="w-11 h-11 rounded-xl2 bg-coral border-2 border-ink shadow-b-xs flex items-center justify-center shrink-0">
          <EditPencil className="w-5 h-5" color="#fff" aria-hidden />
        </span>
        <div>
          <div className="font-display font-semibold text-[15px] text-ink mb-1">Essay Composer — Academic Grade</div>
          <div className="text-ink2 text-[12px] leading-relaxed font-medium">Groq-powered · Real citations from 5 live databases · APA 7, MLA 9, Harvard, Chicago · we cook the whole thing fr</div>
        </div>
      </div>
      <div className="b-card rounded-xl3 p-6 mb-4">
        <div className="grid md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block eyebrow text-[10px] text-mute mb-1.5">Topic / Thesis</label>
            <textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={4} className={inputCls}
              placeholder="e.g. The impact of mobile banking on financial inclusion in Sub-Saharan Africa…" />
          </div>
          <div className="flex flex-col gap-3">
            {[['Word Count',['500 words','1,000 words','1,500 words','2,500 words','5,000 words'],wc,setWc],
              ['Citation Style',['APA 7','MLA 9','Harvard','Chicago'],cite,setCite]].map(([lbl,opts,val,setter]:any) => (
              <div key={lbl as string}>
                <label className="block eyebrow text-[10px] text-mute mb-1.5">{lbl}</label>
                <select value={val} onChange={e=>setter(e.target.value)}
                  className="w-full bg-paper border-2 border-ink rounded-xl2 px-3 py-2.5 text-ink text-[13px] outline-none cursor-pointer">
                  {opts.map((o:string) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="block eyebrow text-[10px] text-mute mb-2">Academic Level</label>
          <div className="flex gap-2 flex-wrap">
            {['Undergraduate','Postgraduate','PhD / Research','Professional'].map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`btn px-3.5 py-1.5 text-[12px] rounded-full border-2 border-ink
                  ${level===l ? 'bg-blue text-white' : 'bg-paper3 text-ink2 hover:bg-paper2'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={compose} disabled={busy}
            className="btn btn-coral px-7 py-2.5 text-[13.5px] rounded-full disabled:opacity-40">
            {busy ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />Composing…</span> : 'Compose Essay'}
          </button>
          {output && (
            <>
              <button
                onClick={async () => { setExporting('docx'); try { await exportDocx(output, `Essay — ${topic.slice(0,40)}`, { style:'academic' }) } catch {} setExporting(null) }}
                disabled={exporting==='docx'}
                className="btn btn-ghost px-5 py-2.5 text-[13px] rounded-full border-2 border-ink flex items-center gap-2 disabled:opacity-40">
                {exporting==='docx' ? <><span className="w-3 h-3 border-2 border-ink/25 border-t-ink rounded-full animate-spin"/>DOCX…</> : <><Page className="w-4 h-4" aria-hidden /> DOCX</>}
              </button>
              <button
                onClick={async () => { setExporting('pdf'); try { await exportPdf(output, `Essay — ${topic.slice(0,40)}`, { style:'academic' }) } catch {} setExporting(null) }}
                disabled={exporting==='pdf'}
                className="btn btn-ghost px-5 py-2.5 text-[13px] rounded-full border-2 border-ink flex items-center gap-2 disabled:opacity-40">
                {exporting==='pdf' ? <><span className="w-3 h-3 border-2 border-ink/25 border-t-ink rounded-full animate-spin"/>PDF…</> : <><PageFlip className="w-4 h-4" aria-hidden /> PDF</>}
              </button>
            </>
          )}
        </div>
      </div>
      {output && (
        <div className="b-card rounded-xl3 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink">
            <span className="eyebrow text-[10px] text-blue">Generated Essay</span>
            <button onClick={() => navigator.clipboard.writeText(output).catch(()=>{})}
              className="btn btn-ghost px-3 py-1 text-[11px] rounded-full border-2 border-ink">Copy</button>
          </div>
          <div className="px-6 py-5 text-ink text-[13.5px] leading-[1.82] whitespace-pre-wrap max-h-[500px] overflow-y-auto">{output}</div>
        </div>
      )}
    </div>
  )
}
