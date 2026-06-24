'use client'
import { Globe, Wallet, SmartphoneDevice, Leaf, GraduationCap, Language } from 'iconoir-react'
import { MARKETS, type Market } from '@/lib/payment'

type IconType = typeof Globe

const FLAG: Record<Market, string> = { BW:'🇧🇼', ZA:'🇿🇦', NA:'🇳🇦', ZM:'🇿🇲', ZW:'🇿🇼', OTHER:'🌍' }
const REGION: Market[] = ['BW', 'ZA', 'NA', 'ZM', 'ZW']

const LIVE: { Icon: IconType; title: string; desc: string }[] = [
  { Icon: Wallet,            title:'Local-currency pricing', desc:'Pay in Pula, Rand, Namibian Dollar, Kwacha or USD — priced for students, not Silicon Valley.' },
  { Icon: SmartphoneDevice,  title:'Mobile-money checkout',  desc:'Orange Money, MyZaka, EcoCash, Airtel & MTN Money — no card required in most markets.' },
  { Icon: Leaf,              title:'Lightweight & mobile-first', desc:'Built to stay fast and light on metered mobile data — the mascot and UI are a few KB, not megabytes.' },
]

const ROADMAP: { Icon: IconType; title: string; desc: string }[] = [
  { Icon: GraduationCap, title:'University referencing presets', desc:'One-tap formatting for UB, UNAM, UCT, Wits, UNZA and UZ house styles.' },
  { Icon: Language,      title:'African-language support',       desc:'Setswana, isiZulu, Swahili and more — humanizing that respects how the region actually writes.' },
]

export default function AfricaPage() {
  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="flex items-start gap-3 px-5 py-4 mb-5 b-card rounded-xl3">
        <span className="w-11 h-11 rounded-xl2 bg-mint border-2 border-ink shadow-b-xs flex items-center justify-center shrink-0">
          <Globe className="w-5 h-5" color="#fff" aria-hidden />
        </span>
        <div>
          <div className="font-display font-semibold text-[15px] text-ink mb-1">Built for Southern Africa</div>
          <div className="text-ink2 text-[12px] font-medium leading-relaxed">
            Local currency, mobile-money checkout, and a product that respects metered data — designed
            around how students here actually study and pay. fr.
          </div>
        </div>
      </div>

      {/* Markets */}
      <div className="eyebrow text-[11px] text-coral mb-3">Where we're live</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {REGION.map(m => {
          const mk = MARKETS[m]
          return (
            <div key={m} className="b-card-sm rounded-xl2 bg-paper3 px-4 py-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[18px] leading-none">{FLAG[m]}</span>
                <span className="font-display font-semibold text-[13px] text-ink">{mk.label}</span>
                <span className="ml-auto font-mono text-[11px] text-blue font-semibold">{mk.currency}</span>
              </div>
              <div className="text-[11px] text-ink2 leading-snug font-medium">{mk.rails}</div>
            </div>
          )
        })}
      </div>

      {/* Live capabilities */}
      <div className="grid md:grid-cols-1 gap-3 mb-6">
        {LIVE.map(f => (
          <div key={f.title} className="b-card rounded-xl3 flex items-start gap-3 px-4 py-4">
            <span className="w-10 h-10 rounded-xl2 bg-blue border-2 border-ink shadow-b-xs flex items-center justify-center shrink-0 mt-0.5">
              <f.Icon className="w-4 h-4" color="#fff" aria-hidden />
            </span>
            <div>
              <div className="font-display font-semibold text-[13.5px] text-ink mb-1">{f.title}</div>
              <div className="text-[12px] text-ink2 leading-relaxed font-medium">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Roadmap */}
      <div className="eyebrow text-[11px] text-coral mb-3">On the roadmap</div>
      <div className="grid md:grid-cols-2 gap-3">
        {ROADMAP.map(f => (
          <div key={f.title} className="b-card rounded-xl3 flex items-start gap-3 px-4 py-4 bg-paper2">
            <span className="w-10 h-10 rounded-xl2 bg-paper border-2 border-ink flex items-center justify-center shrink-0 mt-0.5">
              <f.Icon className="w-4 h-4 text-ink" aria-hidden />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-display font-semibold text-[13.5px] text-ink">{f.title}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold
                  bg-sun text-ink border-2 border-ink uppercase tracking-wide">Soon</span>
              </div>
              <div className="text-[12px] text-ink2 leading-relaxed font-medium">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
