'use client'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

export default function LandingPage() {
  const ghostRef = useRef<GhostRiveHandle>(null)

  useEffect(() => {
    // Writing when bypass section visible
    const bypassEl = document.getElementById('bypass')
    if (!bypassEl) return
    const obs = new IntersectionObserver(([e]) => {
      ghostRef.current?.setState(e.isIntersecting ? 'writing' : 'idle')
    }, { threshold: 0.4 })
    obs.observe(bypassEl)
    return () => obs.disconnect()
  }, [])

  return (
    <main className="relative z-10">
      {/* NAV */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-5xl
        flex items-center gap-5 px-5 py-3 rounded-3xl
        bg-vb2/80 backdrop-blur-2xl border border-white/10
        shadow-[0_4px_32px_rgba(0,0,0,0.3)]">
        <Link href="/" className="flex items-center gap-2 mr-auto font-display font-black text-[17px]">
          <img src="/ghost-logo.png" className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(124,92,252,0.4)]" alt="" />
          Ghost<span className="text-pp">Write</span>
        </Link>
        <div className="hidden md:flex gap-1">
          {['Features','Bypass','Africa','Pricing'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="px-3 py-1.5 rounded-full text-gg text-sm font-label font-medium
                hover:text-sw hover:bg-white/5 transition-all">{l}</a>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="px-4 py-2 rounded-full text-sm font-label font-semibold
            text-gg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-sw transition-all">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-full text-sm font-label font-bold
            text-white bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
            relative overflow-hidden btn-shimmer">
            Start free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen grid md:grid-cols-2 items-center gap-16 max-w-6xl mx-auto
        px-6 pt-32 pb-20">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6
            bg-pp/10 border border-pp/30 text-pp2 text-xs font-label font-bold uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-bg animate-blink" />
            Built for African students &amp; professionals
          </div>
          <h1 className="font-display font-black text-[clamp(44px,6vw,74px)] leading-[1.03]
            tracking-[-2.5px] text-sw mb-5">
            Invisible craft.<br />
            <span className="italic bg-gradient-to-r from-pp via-pp2 to-fl bg-clip-text text-transparent">
              Visible results.
            </span>
          </h1>
          <p className="text-gg text-[clamp(15px,1.6vw,18px)] leading-relaxed max-w-md mb-8">
            GhostWrite transforms AI-generated drafts into authentically human prose —
            so undetectable, it feels like it was always yours.
          </p>
          <div className="flex gap-3 flex-wrap mb-7">
            <Link href="/register"
              className="px-9 py-3.5 rounded-full font-label font-bold text-[15px] text-white
                bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
                hover:shadow-[0_8px_28px_rgba(124,92,252,0.50)] hover:-translate-y-px
                relative overflow-hidden btn-shimmer">
              Start for free →
            </Link>
            <a href="#features"
              className="px-8 py-3.5 rounded-full font-label font-bold text-[15px]
                text-gg bg-white/5 border border-white/10
                hover:bg-white/10 hover:text-sw transition-all">
              See features
            </a>
          </div>
          <div className="flex gap-4 flex-wrap text-xs font-label font-medium text-gg2">
            {['No credit card','Pay in Pula','Cancel anytime','Free forever plan'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-bg/10 border border-bg/25
                  flex items-center justify-center text-bg text-[9px]">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>
        {/* Ghost mascot with floating cards */}
        <div className="relative flex items-center justify-center min-h-[460px]">
          <div className="absolute w-72 h-72 rounded-full
            bg-[radial-gradient(circle,rgba(124,92,252,0.14),rgba(124,92,252,0.04)_50%,transparent_70%)]
            animate-[haloBreath_4s_ease-in-out_infinite]" />
          <GhostRive ref={ghostRef} width={240} height={240}
            logoSrc="/ghost-logo.png" riv="/ghostwrite.riv"
            initialState="idle" className="relative z-10 animate-ghost-float
              drop-shadow-[0_12px_40px_rgba(124,92,252,0.35)]" />
          {/* Floating stat cards */}
          {[
            { cls:'top-10 right-0',   val:'99.4%', lbl:'Bypass Rate',    col:'#10B981', anim:'fc1' },
            { cls:'bottom-24 right-[-20px]', val:'8',     lbl:'AI Models',     col:'#9B7EFD', anim:'fc2' },
            { cls:'top-24 left-[-20px]',  val:'1.8s',  lbl:'Speed',          col:'#F59E0B', anim:'fc3' },
            { cls:'bottom-16 left-0', val:'BWP 35',lbl:'Student/mo',    col:'#7C5CFC', anim:'fc4' },
          ].map(c => (
            <div key={c.lbl} className={`absolute ${c.cls} z-20
              px-4 py-3 rounded-2xl border border-white/10 bg-vb2/90
              backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              animate-[${c.anim}Float_5s_ease-in-out_infinite]`}>
              <div className="text-[9px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">{c.lbl}</div>
              <div className="font-mono font-semibold text-lg leading-none" style={{ color: c.col }}>{c.val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF STRIP */}
      <div className="border-y border-white/5 bg-vb2/60 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between gap-6">
          {[
            ['99.4%','Hyper bypass'],['6','Detectors'],['8','AI models'],
            ['5,000','Words/request'],['BWP 35','Student/mo'],['250M+','Citations'],
          ].map(([v,l]) => (
            <div key={l} className="text-center flex-1 min-w-[80px]">
              <div className="font-mono font-semibold text-2xl text-pp2 tracking-tight leading-none">{v}</div>
              <div className="text-gg2 text-xs font-label font-medium mt-1.5 uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4
              bg-pp/8 border border-pp/25 text-pp2 text-[11px] font-label font-bold uppercase tracking-wider">
              What we do
            </div>
            <h2 className="font-display font-black text-[clamp(30px,4vw,48px)]
              tracking-[-1.2px] text-sw mb-3">
              Everything you need to write <span className="italic text-pp2">confidently</span>
            </h2>
            <p className="text-gg text-[clamp(14px,1.5vw,17px)] max-w-lg mx-auto leading-relaxed">
              Six precision-built tools. One seamless workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={`glass rounded-2xl p-7 hover:-translate-y-1 transition-all duration-300
                  hover:border-white/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                  ${f.wide ? 'md:col-span-2' : ''}`}>
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10
                  flex items-center justify-center text-xl mb-4">{f.icon}</div>
                <h3 className="font-display font-bold text-[17px] text-sw mb-2">{f.title}</h3>
                <p className="text-gg text-[13px] leading-relaxed">{f.desc}</p>
                {f.badges && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    {f.badges.map(b => (
                      <span key={b} className="px-2.5 py-1 rounded-full font-mono text-[10.5px] font-medium
                        bg-bg/10 border border-bg/25 text-bg">{b}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BYPASS */}
      <section id="bypass" className="py-28 px-6 bg-vb2/50 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="font-mono font-semibold text-[clamp(80px,14vw,140px)] leading-none tracking-[-6px]
              bg-gradient-to-br from-bg via-pp2 to-fl bg-clip-text text-transparent block">
              99.4
            </span>
            <span className="font-mono text-[clamp(28px,5vw,48px)] text-pp2 leading-none tracking-[-2px]">% bypass</span>
            <p className="text-gg2 text-xs font-label font-semibold uppercase tracking-widest mt-3">
              Hyper mode — all 6 detectors
            </p>
          </div>
          <div>
            <p className="text-gg text-[13.5px] leading-relaxed mb-5">
              Three algorithm tiers — Standard (97.2%), Pro (98.8%), Hyper (99.4%) —
              each engineered to defeat a different tier of AI detection. Ryne AI's paid Pro
              tier achieves ~80%. Our free tier does better.
            </p>
            <div className="flex flex-col gap-2.5 mb-6">
              {[['Turnitin AI','#10B981',99],['GPTZero','#9B7EFD',98],
                ['Originality.ai','#10B981',99],['Copyleaks','#F59E0B',97],
                ['ZeroGPT','#10B981',99],['Sapling AI','#9B7EFD',99]].map(([n,c,v]) => (
                <div key={n as string} className="flex items-center gap-3">
                  <span className="font-label font-semibold text-gg text-[12px] w-24 shrink-0">{n}</span>
                  <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${v}%`, background: c as string }} />
                  </div>
                  <span className="font-mono text-[12px] font-semibold w-9 text-right" style={{ color: c as string }}>{v}%</span>
                </div>
              ))}
            </div>
            <Link href="/register"
              className="inline-flex px-8 py-3 rounded-full font-label font-bold text-sm text-white
                bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]">
              Try it free →
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-28 px-6 bg-vb2/40 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4
              bg-pp/8 border border-pp/25 text-pp2 text-[11px] font-label font-bold uppercase tracking-wider">
              Pricing
            </div>
            <h2 className="font-display font-black text-[clamp(28px,4vw,46px)] tracking-[-1.2px] text-sw mb-3">
              One plan. <span className="italic text-pp2">Everything included.</span>
            </h2>
          </div>
          <div className="flex justify-center">
            {PLANS.map(p => (
              <div key={p.name}
                className={`glass rounded-3xl p-8 relative transition-all duration-300
                  hover:-translate-y-1 ${p.popular
                    ? 'border-pp/40 bg-pp/5 shadow-[0_0_0_1px_rgba(124,92,252,0.15)]'
                    : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2
                    px-4 py-1 rounded-full bg-pp text-white text-[10px] font-label font-bold
                    uppercase tracking-wide shadow-[0_3px_10px_rgba(124,92,252,0.35)] whitespace-nowrap">
                    Most popular
                  </div>
                )}
                <div className="font-label text-[10px] font-bold text-gg uppercase tracking-widest mb-3">{p.name}</div>
                <div className="font-mono font-semibold text-[38px] tracking-[-2px] text-sw leading-none mb-1">
                  <span className="text-[16px] text-gg font-normal mr-0.5">BWP</span>{p.price}
                </div>
                <div className="text-gg text-[12.5px] font-label mb-5">{p.period}</div>
                <div className="h-px bg-white/6 mb-5" />
                {p.features.map(f => (
                  <div key={f} className="flex gap-2 items-start text-[13px] text-gg mb-2.5">
                    <span className="text-bg mt-0.5 shrink-0 font-bold">✓</span>{f}
                  </div>
                ))}
                <Link href="/register"
                  className={`mt-5 flex items-center justify-center w-full py-2.5 rounded-full
                    font-label font-bold text-[13px] transition-all
                    ${p.popular
                      ? 'bg-pp text-white hover:bg-pp2 shadow-[0_4px_16px_rgba(124,92,252,0.35)]'
                      : 'bg-white/5 border border-white/10 text-gg hover:bg-white/10 hover:text-sw'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 flex items-center justify-center relative overflow-hidden">
        <img src="/ghost-logo.png" className="absolute right-10 top-1/2 -translate-y-1/2
          w-80 h-80 object-contain opacity-[0.04] pointer-events-none blur-sm" alt="" />
        <div className="relative z-10 max-w-xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5
            bg-pp/8 border border-pp/25 text-pp2 text-[11px] font-label font-bold uppercase tracking-wider">
            🚀 Founding member offer
          </div>
          <h2 className="font-display font-black text-[clamp(32px,5vw,54px)]
            tracking-[-1.8px] text-sw mb-4 leading-[1.05]">
            Lock in{' '}
            <span className="italic bg-gradient-to-r from-bg to-pp2 bg-clip-text text-transparent">
              BWP 25/month
            </span>
            {' '}forever
          </h2>
          <p className="text-gg text-[clamp(14px,1.5vw,16.5px)] leading-relaxed mb-8">
            First 50 subscribers get the Student plan at BWP 25/month — locked permanently, for life.
          </p>
          <Link href="/register"
            className="inline-flex px-10 py-4 rounded-full font-label font-bold text-[15px] text-white
              bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
              hover:shadow-[0_8px_28px_rgba(124,92,252,0.50)] hover:-translate-y-px
              relative overflow-hidden btn-shimmer">
            Claim my founding spot →
          </Link>
          <p className="text-gg2 text-xs mt-4 font-label">No credit card · Cancel anytime · BWP billing</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-vb2/60 px-6 py-12 relative overflow-hidden">
        <img src="/ghost-logo.png" className="absolute right-0 bottom-0
          w-48 h-48 object-contain opacity-[0.06] pointer-events-none" alt="" />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/ghost-logo.png" className="w-7 h-7 object-contain
                drop-shadow-[0_2px_6px_rgba(124,92,252,0.35)]" alt="" />
              <span className="font-display font-black text-[16px]">
                Ghost<span className="text-pp">Write</span>
              </span>
            </div>
            <p className="font-display italic text-gg text-[14px] leading-relaxed max-w-[200px]">
              Your ideas. Your voice. <span className="text-pp2">Invisible craft.</span>
            </p>
          </div>
          {[
            { title:'Product', links:['Features','Pricing','Africa Suite','FAQ'] },
            { title:'Tools',   links:['AI Humanizer','Essay Composer','Citation Lab','Bypass Checker'] },
            { title:'Company', links:['About','TenderIQ','Contact','Privacy'] },
          ].map(col => (
            <div key={col.title}>
              <div className="text-[10.5px] font-label font-bold text-gg2 uppercase tracking-widest mb-4">{col.title}</div>
              {col.links.map(l => (
                <a key={l} href="#" className="block text-[13.5px] text-gg hover:text-pp2 transition-colors mb-2.5">{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="max-w-5xl mx-auto flex justify-between items-center pt-6 border-t border-white/5 flex-wrap gap-3">
          <span className="text-gg2 text-xs font-label">© 2026 GhostWrite · Meta-Genesis, Francistown, Botswana</span>
          <div className="flex gap-2">
            {['🔒 Secure','🌍 Africa-first','⚡ Groq powered'].map(b => (
              <span key={b} className="px-3 py-1 rounded-full text-[11px] font-label font-semibold
                text-gg2 bg-white/4 border border-white/6">{b}</span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}

const FEATURES = [
  { icon:'✨', title:'AI Humanizer', wide:true,
    desc:'Three algorithm tiers — Standard (97.2%), Pro (98.8%), Hyper (99.4%) — rewriting AI text to pass every major detector. Writing DNA captures your personal voice.',
    badges:['99.4% bypass','Standard · Pro · Hyper','5,000 words/request'] },
  { icon:'💬', title:'Multi-Model Chat', wide:false,
    desc:'GhostAll queries GPT-4o, Claude 3.5, Gemini, Grok-2 and 4 more simultaneously — synthesizing the strongest response. 8 models, one interface.' },
  { icon:'✍️', title:'Essay Composer', wide:false,
    desc:'Exact word counts, real citations from 5 live academic databases, auto-formatted in APA 7, MLA 9, Harvard, or Chicago.' },
  { icon:'🛡️', title:'Bypass Checker', wide:false,
    desc:'Turnitin, GPTZero, Originality.ai, Copyleaks, ZeroGPT, and Sapling — all six simultaneously. One clean report.' },
  { icon:'📚', title:'Citation Lab', wide:false,
    desc:'250M+ verified sources. Every citation real. Every DOI verifiable. Verify Paper audits your full reference list.' },
  { icon:'🌍', title:'Africa Suite', wide:false,
    desc:'Setswana, Zulu, Swahili + 9 more. UB/BUAN/BIUST presets. BWP billing. Low-bandwidth mode. Built in Francistown.' },
]

const PLANS = [
  { name:'Pro',    price:'80', period:'per month · cancel anytime',
    popular:true,  cta:'Start with Pro →',
    features:[
      'Unlimited words',
      'All 3 tiers — Standard, Pro, Hyper ⚡',
      'All 6 AI detectors',
      'All 8 chat models + GhostAll',
      'Writing DNA personal voice profile',
      'Full Citation Lab (250M+ sources)',
      'Africa Suite — 5 languages + UB/BUAN/BIUST presets',
      'DOCX + PDF export',
      'AJOL + SABINET access',
      'Priority processing',
    ]},
]
