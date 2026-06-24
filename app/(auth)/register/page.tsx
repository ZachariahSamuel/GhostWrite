'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeClosed, MailOpen, Rocket } from 'iconoir-react'
import { createClient } from '@/lib/supabase'
import { GoogleIcon, GitHubIcon } from '@/components/icons/Brand'
import { CasperMark } from '@/components/ghost/CasperMark'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

const COUNTRIES = [
  ['BW','🇧🇼 Botswana'],['ZA','🇿🇦 South Africa'],['NA','🇳🇦 Namibia'],
  ['ZW','🇿🇼 Zimbabwe'],['ZM','🇿🇲 Zambia'],['KE','🇰🇪 Kenya'],
  ['TZ','🇹🇿 Tanzania'],['GH','🇬🇭 Ghana'],['NG','🇳🇬 Nigeria'],['OTHER','🌍 Other'],
]

export default function RegisterPage() {
  const router   = useRouter()
  const ghostRef = useRef<GhostRiveHandle>(null)
  const [form, setForm] = useState({
    fname:'', lname:'', email:'', pass:'', country:'BW'
  })
  const [err,     setErr]     = useState('')
  const [done,    setDone]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass,setShowPass]= useState(false)

  const passReqs = {
    len:   form.pass.length >= 8,
    num:   /\d/.test(form.pass),
    upper: /[A-Z]/.test(form.pass),
  }
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!form.fname.trim()) { setErr('Please enter your first name.'); return }
    if (!passReqs.len)      { setErr('Password must be at least 8 characters.'); return }

    setLoading(true)
    ghostRef.current?.setState('loading')

    const sb = createClient()
    const { data, error } = await sb.auth.signUp({
      email:    form.email,
      password: form.pass,
      options:  {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard/humanizer`,
        data: {
          full_name:     `${form.fname} ${form.lname}`.trim(),
          first_name:    form.fname,
          last_name:     form.lname,
          country:       form.country,
          plan:          'pro',
          credits_total: 999999,
        },
      },
    })

    if (error) {
      setErr(error.message)
      setLoading(false)
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      return
    }

    if (data.user && !data.session) {
      ghostRef.current?.setState('success')
      setDone(true)
      setLoading(false)
      return
    }

    ghostRef.current?.setState('success')
    setTimeout(() => router.push('/dashboard/humanizer'), 900)
  }

  const inputCls = "w-full bg-paper border-2 border-ink rounded-xl2 px-4 py-2.5 text-ink text-[13px] font-body outline-none focus:bg-paper3 transition-colors placeholder:text-mute"
  const labelCls = "block eyebrow text-[10px] text-mute mb-1"

  // ── Email sent confirmation screen ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-paper">
        <div className="b-card max-w-sm w-full text-center rounded-xl3 p-8">
          <div className="w-16 h-16 rounded-xl2 bg-mint border-2 border-ink shadow-b-xs
            flex items-center justify-center mx-auto mb-5">
            <MailOpen className="w-7 h-7" color="#fff" aria-hidden />
          </div>
          <h2 className="font-display font-semibold text-[24px] text-ink mb-3 tracking-[-0.01em]">
            Check your email
          </h2>
          <p className="text-ink2 text-[14px] leading-relaxed mb-5">
            We sent a confirmation link to{' '}
            <strong className="text-ink">{form.email}</strong>.
            Click it to activate your account and access the dashboard.
          </p>
          <div className="px-4 py-3 rounded-xl2 bg-paper2 border-2 border-ink text-ink text-[13px] font-semibold mb-6">
            ✓ Check spam if you don't see it within 2 minutes
          </div>
          <Link href="/login" className="text-blue font-semibold text-[13.5px] hover:underline">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT brand panel */}
      <div className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden
        bg-coral text-paper border-r-2 border-ink">
        <img src="/casper.png"
          className="absolute -bottom-10 -right-10 w-64 h-64 object-contain opacity-[0.14] pointer-events-none casper-float" alt="" />
        <div>
          <CasperMark tone="paper" href="/" size={38} textSize={20} className="mb-12" />
          <h2 className="font-display font-semibold text-[clamp(24px,3vw,36px)] leading-[1.04] tracking-[-0.02em] mb-4">
            Join the founding<br /><span className="mark-hi px-1">50 members.</span>
          </h2>
          <p className="text-paper/85 text-sm leading-relaxed mb-8 max-w-xs">
            Full access — unlimited words, all three humanizer modes, your Writing-DNA
            voice profile, real DOI-verified citations, and the live detector gauge. From P80/month. fr.
          </p>
          <GhostRive ref={ghostRef} width={160} height={160} initialState="idle" className="mx-auto block" />
          <div className="mt-6 px-4 py-3 rounded-xl2 bg-paper/10 border-2 border-paper/25">
            <div className="font-mono font-semibold text-[28px] text-sun tracking-tight leading-none">BWP 80</div>
            <div className="text-paper/80 text-[12px] font-medium mt-1">per month · Pro plan · cancel anytime</div>
          </div>
        </div>
        <span className="sticker sticker-paper tilt-r w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-blue animate-blink" />
          built for african students &amp; pros
        </span>
      </div>

      {/* RIGHT auth panel */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-10 bg-paper relative overflow-y-auto">
        <div className="max-w-sm mx-auto w-full">
          <CasperMark tone="ink" href="/" size={32} textSize={18} className="mb-6 md:hidden" />

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-paper2 rounded-full border-2 border-ink mb-6">
            <Link href="/login"
              className="flex-1 py-2 text-center font-mono font-semibold text-[13px] text-ink2 hover:text-ink transition-colors">Sign in</Link>
            <Link href="/register"
              className="flex-1 py-2 text-center font-mono font-semibold text-[13px] rounded-full bg-ink text-paper">Create account</Link>
          </div>

          {err && (
            <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[13px] font-medium mb-4">{err}</div>
          )}

          <div className="flex gap-2 mb-3">
            {(['google','github'] as const).map(p => (
              <button key={p}
                className="btn flex-1 gap-2 py-2.5 text-[12.5px] bg-paper3 text-ink hover:bg-paper2">
                {p==='google'? <GoogleIcon /> : <GitHubIcon />} {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 my-3 text-mute text-xs font-mono">
            <div className="flex-1 h-0.5 bg-ink/15" />or sign up with email<div className="flex-1 h-0.5 bg-ink/15" />
          </div>

          <form onSubmit={doRegister} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {[['fname','First name','Zach'],['lname','Last name','M.']].map(([k,l,p]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input value={(form as any)[k]} onChange={set(k)} placeholder={p} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} value={form.pass} onChange={set('pass')}
                  placeholder="Min. 8 characters" required className={inputCls + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors">
                  {showPass ? <EyeClosed className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-1.5">
                {[['len','8+ characters'],['num','Contains number'],['upper','Uppercase letter']].map(([k,l]) => (
                  <div key={k} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors
                    ${(passReqs as any)[k] ? 'text-mint' : 'text-mute'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all
                      ${(passReqs as any)[k] ? 'bg-mint' : 'bg-mute'}`} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <select value={form.country} onChange={set('country')}
                className={inputCls + ' cursor-pointer'}>
                {COUNTRIES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Single plan — Pro BWP 80 */}
            <div className="px-4 py-3 rounded-xl2 bg-paper2 border-2 border-ink flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-display font-semibold text-[13px] text-ink mb-0.5">
                  <Rocket className="w-4 h-4 text-blue" aria-hidden /> Pro Plan
                </div>
                <div className="text-[11px] text-ink2 font-medium">Unlimited · Hyper mode · Writing DNA · Africa Suite</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-[18px] text-blue leading-none">BWP 80</div>
                <div className="text-[10px] text-mute">/month</div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn btn-coral mt-1 w-full py-3 text-[14px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account — BWP 80/mo →'}
            </button>
          </form>
          <p className="text-center text-ink2 text-[12.5px] font-medium mt-4">
            Have an account?{' '}
            <Link href="/login" className="text-blue font-semibold hover:underline">Sign in</Link>
          </p>
          <p className="text-center text-mute text-[11px] font-mono mt-2">
            Cancel anytime · Pay in BWP · No hidden fees
          </p>
        </div>
      </div>
    </div>
  )
}
