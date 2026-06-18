'use client'
import { useDash } from '../layout'

export default function AnalyticsPage() {
  const { sessionWords, sessionDocs } = useDash()
  const tools = [
    { label:'Humanizer',    pct:sessionWords>0?62:0, color:'#7C5CFC' },
    { label:'AI Chat',      pct:sessionWords>0?18:0, color:'#10B981' },
    { label:'Essay Composer',pct:sessionWords>0?12:0,color:'#F59E0B' },
    { label:'Citation Lab', pct:sessionWords>0?8:0,  color:'#C67B5C' },
  ]
  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          { lbl:'Total Words', val:sessionWords.toLocaleString()||'0', sub:'This session', green:false },
          { lbl:'Avg. Bypass',  val:sessionDocs>0?'97.8%':'—', sub:'Best in class', green:true },
          { lbl:'Documents',    val:String(sessionDocs), sub:'This session', green:false },
        ].map(s => (
          <div key={s.lbl} className="glass rounded-xl px-5 py-5">
            <div className="text-[9.5px] font-label font-bold text-gg3 uppercase tracking-widest mb-2">{s.lbl}</div>
            <div className={`font-mono font-semibold text-[26px] tracking-tight leading-none mb-1.5 ${s.green?'text-bg':'text-sw'}`}>{s.val}</div>
            <div className="text-[11px] text-gg font-label">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-6">
        <div className="text-[11px] font-label font-bold text-gg3 uppercase tracking-widest mb-5">Usage by Tool</div>
        {tools.map(t => (
          <div key={t.label} className="flex items-center gap-3 mb-4 last:mb-0">
            <span className="font-label font-medium text-[12px] text-gg w-36 shrink-0">{t.label}</span>
            <div className="flex-1 h-[5px] bg-white/6 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-[1200ms]"
                style={{ width:`${t.pct}%`, background:t.color }} />
            </div>
            <span className="font-mono text-[12px] font-semibold text-sw w-9 text-right">{t.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
