'use client'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowRight, ShieldCheck, EditPencil, OpenBook, Check, Flash, Sparks,
} from 'iconoir-react'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'
import { CasperMark } from '@/components/ghost/CasperMark'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })
const LiveDemo  = dynamic(() => import('@/components/landing/LiveDemo'), { ssr: false })
const AcademicBackdrop = dynamic(() => import('@/components/landing/AcademicBackdrop'), { ssr: false })

const REGIONS = ['Botswana', 'South Africa', 'Namibia', 'Zambia', 'Zimbabwe', 'Worldwide']

const STEPS = [
  { Icon: ShieldCheck, bg: 'var(--blue)', t: 'See your score, live',
    d: 'Paste your draft and watch a real AI-detector score move the second you stop typing. No black box, no cap — you always know where you stand.' },
  { Icon: EditPencil, bg: 'var(--coral)', t: 'Sound like you, fr',
    d: 'Writing DNA learns your rhythm, slang and tone, then rewrites the draft so it reads like you actually wrote it — not some robot.' },
  { Icon: OpenBook, bg: 'var(--sun)', fg: '#1A1A17', t: 'Cite real sources',
    d: 'Pull genuine, DOI-checkable references straight from CrossRef in APA, MLA, Harvard or Chicago. Zero made-up papers, no cap.' },
]

const PLANS = [
  { name: 'Free', price: 'Free', cadence: 'forever', popular: false, cta: 'Start free', accent: 'paper',
    features: ['1,500 words / month', 'Live detector gauge', '3 citations / day'] },
  { name: 'Monthly', price: 'P80', cadence: '/ month', popular: false, cta: 'Go monthly', accent: 'blue',
    features: ['Unlimited words', 'Full detector radar', 'Writing DNA + exports'] },
  { name: 'Semester Pass', price: 'P129', cadence: 'once · 5 months', popular: true, cta: 'Get sorted', accent: 'coral',
    features: ['Everything, all term', 'One payment — no recurring', 'Priority + uni presets'] },
  { name: 'Annual', price: 'P349', cadence: '/ year', popular: false, cta: 'Go annual', accent: 'sun',
    features: ['Everything in Monthly', 'Cheapest per month', 'Early access to new tools'] },
]

export default function LandingPage() {
  const ghostRef = useRef<GhostRiveHandle>(null)

  useEffect(() => {
    const el = document.getElementById('demo')
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      ghostRef.current?.setState(e.isIntersecting ? 'writing' : 'idle')
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <main className="relative text-ink font-body overflow-hidden">

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-[68px] flex items-center gap-6
          bg-paper/85 backdrop-blur-md border-b-2 border-ink">
          <CasperMark href="/" tone="ink" size={34} textSize={20} className="mr-auto" />
          <div className="hidden md:flex items-center gap-7 text-[14px] font-medium text-ink2">
            {['How it works', 'Try it', 'Pricing'].map(l => (
              <a key={l} href={`#${l.split(' ')[0].toLowerCase()}`} className="hover:text-blue transition-colors">{l}</a>
            ))}
          </div>
          <Link href="/login" className="hidden sm:block text-[14px] font-medium text-ink2 hover:text-blue transition-colors">Sign in</Link>
          <Link href="/register" className="btn btn-primary px-5 py-2.5 text-[13px] rounded-full">
            Start free <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center px-5 pt-28 pb-16 overflow-hidden">
        <AcademicBackdrop className="z-0" />

        <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-[1.08fr_0.92fr] gap-12 items-center">
          {/* copy */}
          <div className="text-center lg:text-left">
            <span className="sticker tilt-l mb-7">
              <Sparks className="w-3.5 h-3.5" aria-hidden /> live ai-score · no signup
            </span>
            <h1 className="font-display font-semibold text-[clamp(44px,7.4vw,86px)] leading-[0.94] tracking-[-0.02em] mb-6 mt-5">
              Make AI<br />sound like{' '}
              <span className="riso-text riso-blue" data-text="you.">you.</span>
            </h1>
            <p className="text-[clamp(15px,1.6vw,19px)] text-ink2 leading-relaxed max-w-lg mb-9 mx-auto lg:mx-0">
              GhostWrite rewrites your draft in your <span className="font-semibold mark-hi">real voice</span> — and
              shows a live AI-detector score before you hit submit. So you never get wrongly flagged. lowkey a cheat code.
            </p>
            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start mb-9">
              <Link href="/register" className="btn btn-coral group px-8 py-4 text-[15px] rounded-full">
                Start writing free
                <Flash className="w-4 h-4 group-hover:rotate-12 transition-transform" aria-hidden />
              </Link>
              <a href="#try" className="btn btn-ghost px-6 py-4 text-[15px] rounded-full border-2 border-ink">
                Try it live <ArrowRight className="w-4 h-4" aria-hidden />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-[12.5px] text-mute font-medium">
              {['No card needed', 'Pay in your currency', 'Cancel anytime'].map(t => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-mint" aria-hidden /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Casper — floating free on the paper, no box */}
          <div className="relative flex justify-center items-center min-h-[360px]">
            {/* soft glow grounds him on the paper so he doesn't look pasted on */}
            <div aria-hidden className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 46%, rgba(43,68,255,0.14), transparent 60%)' }} />
            <GhostRive ref={ghostRef} width={340} height={340} initialState="idle" />
            {/* playful floating labels — stickers, not a box */}
            <span className="sticker sticker-coral tilt-r absolute top-4 right-2 z-20">it's giving human</span>
            <span className="sticker tilt-l absolute bottom-6 left-0 z-20">92% · reads human</span>
          </div>
        </div>
      </section>

      {/* REGIONS — marquee ticker */}
      <div className="border-y-2 border-ink bg-ink text-paper overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-3.5">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center shrink-0">
              {REGIONS.map(r => (
                <span key={r + dup} className="inline-flex items-center gap-3 px-6 font-mono text-[13px] font-medium uppercase tracking-wider">
                  <Sparks className="w-3.5 h-3.5 text-sun" aria-hidden /> {r}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow text-coral">How it works</span>
          <h2 className="font-display font-semibold text-[clamp(30px,4.6vw,50px)] leading-[1.02] tracking-[-0.02em] mt-3">
            Three taps from <span className="mark-hi">stressed to sorted.</span> fr.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.t} className="b-card b-lift relative rounded-xl3 p-7">
              <span className="absolute top-5 right-5 font-mono text-[12px] font-bold text-mute">0{i + 1}</span>
              <div className="w-14 h-14 rounded-xl2 border-2 border-ink flex items-center justify-center mb-5 shadow-b-xs"
                style={{ background: s.bg }}>
                <s.Icon className="w-7 h-7" color={s.fg ?? '#fff'} aria-hidden />
              </div>
              <h3 className="font-display font-semibold text-[21px] mb-2.5">{s.t}</h3>
              <p className="text-[14px] text-ink2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRY IT — live demo */}
      <section id="try" className="relative px-5 py-24 bg-paper2 border-y-2 border-ink overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow text-coral">Try it · no signup</span>
          <h2 className="font-display font-semibold text-[clamp(30px,4.6vw,50px)] leading-[1.02] tracking-[-0.02em] mt-3 mb-3">
            Watch Casper read your writing.
          </h2>
          <p className="text-ink2 text-[15px]">
            Edit the text below — the gauge scores it the moment you stop typing. Same engine as the full app, no cap. it's giving transparency.
          </p>
        </div>
        <div id="demo"><LiveDemo /></div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow text-coral">Pricing</span>
          <h2 className="font-display font-semibold text-[clamp(30px,4.6vw,50px)] leading-[1.02] tracking-[-0.02em] mt-3 mb-3">
            Cheaper than a <span className="mark-hi">data bundle.</span>
          </h2>
          <p className="text-ink2 text-[14px]">
            Shown in Pula — you'll see your local currency and pay with mobile money or card at checkout.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map(p => {
            const bg = p.accent === 'blue' ? 'var(--blue)' : p.accent === 'coral' ? 'var(--coral)'
              : p.accent === 'sun' ? 'var(--sun)' : 'var(--paper3)'
            const fg = p.accent === 'sun' || p.accent === 'paper' ? '#1A1A17' : '#fff'
            const muted = p.accent === 'sun' || p.accent === 'paper' ? 'rgba(26,26,23,0.65)' : 'rgba(255,255,255,0.8)'
            return (
              <div key={p.name} className="b-card b-lift relative rounded-xl3 p-6 flex flex-col"
                style={{ background: bg, color: fg }}>
                {p.popular && (
                  <span className="sticker tilt-r absolute -top-3 -right-2 z-10">most popular</span>
                )}
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>{p.name}</div>
                <div className="font-display font-semibold leading-none mb-1">
                  <span className="text-[40px]">{p.price}</span>
                </div>
                <div className="text-[12px] mb-5" style={{ color: muted }}>{p.cadence}</div>
                <div className="h-0.5 mb-5" style={{ background: fg, opacity: 0.18 }} />
                <ul className="flex flex-col gap-2.5 mb-7">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] font-medium">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" color={fg} aria-hidden />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className="mt-auto inline-flex items-center justify-center w-full py-3 rounded-xl2 text-[13px] font-semibold border-2 border-ink transition-transform hover:translate-y-[-2px]"
                  style={{ background: fg === '#fff' ? '#fff' : '#1A1A17', color: fg === '#fff' ? '#1A1A17' : '#F4EFE6' }}>
                  {p.cta}
                </Link>
              </div>
            )
          })}
        </div>
        <p className="text-center text-mute text-[12.5px] mt-7 font-medium">
          Pros &amp; researchers: Professional from P199/mo · Societies: campus bundles available.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-24">
        <div className="b-card relative rounded-xl3 px-8 py-20 text-center overflow-hidden bg-blue text-paper"
          style={{ boxShadow: 'var(--shadow-lg)' }}>
          <img src="/casper.png" alt="" aria-hidden className="absolute -right-4 -bottom-8 w-56 h-56 object-contain opacity-25 casper-float" />
          <div className="relative">
            <span className="sticker sticker-paper tilt-l mb-6">founding fifty · locked pricing</span>
            <h2 className="font-display font-semibold text-[clamp(32px,5vw,58px)] leading-[1.0] tracking-[-0.02em] mb-5 mt-5">
              Your words deserve<br />the credit.
            </h2>
            <p className="text-paper/85 text-[15px] max-w-md mx-auto mb-9">
              Join the founding fifty and lock in student pricing for as long as you study. fr, lock in now.
            </p>
            <Link href="/register" className="btn btn-sun px-9 py-4 text-[15px] rounded-full">
              Claim your spot <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-2 border-ink bg-paper2">
        <div className="max-w-6xl mx-auto px-5 py-12 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div>
            <CasperMark href="/" tone="ink" size={32} textSize={18} className="mb-3" />
            <p className="text-ink2 text-[13px] font-medium">Invisible craft. Visible results.</p>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-ink2 font-medium">
            {['How it works', 'Pricing', 'Sign in', 'Privacy', 'Contact'].map(l => (
              <a key={l} href="#" className="hover:text-blue transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 pb-10">
          <div className="h-0.5 bg-ink/15 mb-5" />
          <span className="text-[11.5px] text-mute font-mono">© 2026 GhostWrite · Meta-Genesis, Francistown, Botswana</span>
        </div>
      </footer>
    </main>
  )
}
