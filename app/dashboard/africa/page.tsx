'use client'
const LANGS = [
  { name:'Setswana', live:true },{ name:'Zulu', live:true },
  { name:'Swahili', live:true },{ name:'Afrikaans', live:true },
  { name:'Sotho', live:true },{ name:'Shona', live:false },
  { name:'Hausa', live:false },{ name:'Yoruba', live:false },
  { name:'Amharic', live:false },{ name:'Xhosa', live:false },
  { name:'Igbo', live:false },{ name:'Lingala', live:false },
]
const FEATURES = [
  { icon:'🗣️', title:'African Language Humanization', desc:'5 languages live, 7 in development — writes in your language naturally' },
  { icon:'🎓', title:'UB / BUAN / BIUST / Limkokwing', desc:'Citation and formatting presets for every major Botswana university' },
  { icon:'💰', title:'BWP / ZAR / KES Billing', desc:'Pay in your currency — calibrated to African purchasing power' },
  { icon:'📶', title:'Low-Bandwidth Mode', desc:'60% less data, offline drafts, resumable sessions — works in Maun' },
  { icon:'🧠', title:'African Context Engine', desc:'Suppresses Americanisms — reads as naturally African-authored prose' },
]
export default function AfricaPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 glass rounded-xl"
        style={{ borderColor:'rgba(16,185,129,0.22)' }}>
        <span className="text-2xl shrink-0">🌍</span>
        <div>
          <div className="font-display font-bold text-[14.5px] text-sw mb-1">Africa Suite — Built for the Continent</div>
          <div className="text-gg text-[12px]">The only AI writing platform with African language humanization, SADC databases, local-currency billing, and low-bandwidth mode baked in.</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {FEATURES.map(f => (
          <div key={f.title} className="glass rounded-xl flex items-start gap-3 px-4 py-4
            hover:bg-white/5 hover:translate-x-0.5 transition-all cursor-pointer">
            <span className="text-[18px] w-8 text-center shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <div className="font-label font-bold text-[13px] text-sw mb-1">{f.title}</div>
              <div className="text-[12px] text-gg leading-relaxed">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="glass rounded-xl p-5">
        <div className="text-[11px] font-label font-bold text-gg3 uppercase tracking-widest mb-3">Supported Languages</div>
        <div className="flex gap-2 flex-wrap">
          {LANGS.map(l => (
            <span key={l.name} className={`px-3 py-1.5 rounded-full font-label font-semibold text-[12px] border transition-all
              ${l.live
                ? 'bg-bg/10 border-bg/25 text-bg shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                : 'bg-white/4 border-white/8 text-gg2'}`}>
              {l.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
