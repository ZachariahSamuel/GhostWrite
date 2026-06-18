'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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
        // Points to our callback route — exchanges code then redirects to dashboard
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
      // Email confirmation required
      ghostRef.current?.setState('success')
      setDone(true)
      setLoading(false)
      return
    }

    // Auto-confirmed (e.g. local dev with email confirmation disabled)
    ghostRef.current?.setState('success')
    setTimeout(() => router.push('/dashboard/humanizer'), 900)
  }

  // ── Email sent confirmation screen ──
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-vb">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-bg/10 border border-bg/25
            flex items-center justify-center text-3xl mx-auto mb-5">📬</div>
          <h2 className="font-display font-black text-[24px] text-sw mb-3 tracking-[-0.5px]">
            Check your email
          </h2>
          <p className="text-gg text-[14px] leading-relaxed mb-5">
            We sent a confirmation link to{' '}
            <strong className="text-sw">{form.email}</strong>.
            Click it to activate your account and access the dashboard.
          </p>
          <div className="px-4 py-3 rounded-xl bg-bg/10 border border-bg/25
            text-bg text-[13px] font-label font-semibold mb-6">
            ✓ Check spam if you don't see it within 2 minutes
          </div>
          <Link href="/login"
            className="text-pp2 font-label font-semibold text-[13.5px] hover:text-pp">
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
        bg-gradient-to-br from-pp/15 via-pp/8 to-bg/5 border-r border-pp/20">
        <img src="/ghost-logo.png"
          className="absolute -bottom-10 -right-10 w-64 h-64 object-contain opacity-[0.07] pointer-events-none"
          style={{ animation:'ghostFloat 5s ease-in-out infinite' }} alt="" />
        <div>
          <Link href="/" className="flex items-center gap-2 mb-12 font-display font-black text-[18px]">
            <img src="/ghost-logo.png" className="w-9 h-9 object-contain drop-shadow-[0_4px_12px_rgba(124,92,252,0.4)]" alt="" />
            Ghost<span className="text-pp">Write</span>
          </Link>
          <h2 className="font-display font-black text-[clamp(24px,3vw,34px)] leading-[1.08] tracking-[-1px] text-sw mb-4">
            Join the founding<br /><span className="italic text-pp2">50 members.</span>
          </h2>
          <p className="text-gg text-sm leading-relaxed mb-8 max-w-xs">
            Full Pro access — unlimited words, all three humanizer tiers including Hyper ⚡, Writing DNA, and Africa Suite. BWP 80/month.
          </p>
          <GhostRive ref={ghostRef} width={160} height={160}
            logoSrc="/ghost-logo.png" riv="/ghostwrite.riv"
            initialState="idle" className="mx-auto block" />
          <div className="mt-6 px-4 py-3 rounded-xl bg-vb/50 border border-white/8">
            <div className="font-mono font-semibold text-[28px] text-pp2 tracking-tight leading-none">BWP 80</div>
            <div className="text-gg text-[12px] font-label mt-1">per month · Pro plan · cancel anytime</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
          bg-pp/10 border border-pp/25 text-pp2 text-xs font-label font-bold w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-bg animate-blink" />
          Built for African students &amp; professionals
        </div>
      </div>

      {/* RIGHT auth panel */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-10 bg-vb2 relative overflow-y-auto">
        <div className="absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-pp/30 to-transparent" />
        <div className="max-w-sm mx-auto w-full">
          <Link href="/" className="flex items-center gap-2 mb-6 font-display font-black text-[17px] md:hidden">
            <img src="/ghost-logo.png" className="w-8 h-8 object-contain" alt="" />
            Ghost<span className="text-pp">Write</span>
          </Link>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/4 rounded-full border border-white/6 mb-6 relative">
            <div className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] left-[calc(50%+2px)]
              bg-pp rounded-full shadow-[0_2px_10px_rgba(124,92,252,0.35)] transition-all" />
            <Link href="/login"
              className="flex-1 py-2 text-center font-label font-semibold text-[13px]
                text-gg2 relative z-10 hover:text-sw transition-colors">Sign in</Link>
            <Link href="/register"
              className="flex-1 py-2 text-center font-label font-semibold text-[13px]
                text-white relative z-10">Create account</Link>
          </div>

          {err && (
            <div className="px-4 py-3 rounded-xl bg-err/10 border border-err/25
              text-err text-[13px] font-label font-medium mb-4">{err}</div>
          )}

          <div className="flex gap-2 mb-3">
            {(['google','github'] as const).map(p => (
              <button key={p}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  bg-white/5 border border-white/10 text-sw text-[12.5px] font-label font-semibold
                  hover:bg-white/10 transition-all">
                {p==='google'?'🇬':'🐙'} {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 my-3 text-gg3 text-xs font-label">
            <div className="flex-1 h-px bg-white/6" />or sign up with email<div className="flex-1 h-px bg-white/6" />
          </div>

          <form onSubmit={doRegister} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {[['fname','First name','Zach'],['lname','Last name','M.']].map(([k,l,p]) => (
                <div key={k}>
                  <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">{l}</label>
                  <input value={(form as any)[k]} onChange={set(k)} placeholder={p}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                      text-sw text-[13px] outline-none focus:border-pp transition-all" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-sw text-[13px] outline-none focus:border-pp transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">Password</label>
              <div className="relative">
                <input type={showPass?'text':'password'} value={form.pass} onChange={set('pass')}
                  placeholder="Min. 8 characters" required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                    text-sw text-[13px] outline-none pr-10 focus:border-pp transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gg2 text-sm">
                  {showPass?'🙈':'👁'}
                </button>
              </div>
              <div className="flex flex-col gap-1 mt-1.5">
                {[['len','8+ characters'],['num','Contains number'],['upper','Uppercase letter']].map(([k,l]) => (
                  <div key={k} className={`flex items-center gap-1.5 text-[11px] font-label transition-colors
                    ${(passReqs as any)[k] ? 'text-bg' : 'text-gg3'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all
                      ${(passReqs as any)[k] ? 'bg-bg shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-gg3'}`} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-label font-bold text-gg2 uppercase tracking-widest mb-1">Country</label>
              <select value={form.country} onChange={set('country')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                  text-sw text-[13px] outline-none focus:border-pp transition-all cursor-pointer">
                {COUNTRIES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Single plan — Pro BWP 80 */}
            <div className="px-4 py-3 rounded-xl bg-pp/8 border border-pp/25 flex items-center justify-between">
              <div>
                <div className="font-label font-bold text-[12px] text-sw mb-0.5">🚀 Pro Plan</div>
                <div className="font-label text-[11px] text-gg">Unlimited · Hyper mode · Writing DNA · Africa Suite</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-[18px] text-pp2 leading-none">BWP 80</div>
                <div className="text-[10px] text-gg font-label">/month</div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="mt-1 w-full py-3 rounded-full font-label font-bold text-[14px] text-white
                bg-pp hover:bg-pp2 transition-all shadow-[0_4px_16px_rgba(124,92,252,0.35)]
                disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden btn-shimmer">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account — BWP 80/mo →'}
            </button>
          </form>
          <p className="text-center text-gg text-[12.5px] font-label mt-4">
            Have an account?{' '}
            <Link href="/login" className="text-pp2 font-semibold hover:text-pp">Sign in</Link>
          </p>
          <p className="text-center text-gg3 text-[11px] font-label mt-2">
            Cancel anytime · Pay in BWP · No hidden fees
          </p>
        </div>
      </div>
    </div>
  )
}
