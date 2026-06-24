'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeClosed } from 'iconoir-react'
import { createClient } from '@/lib/supabase'
import { GoogleIcon, GitHubIcon } from '@/components/icons/Brand'
import { CasperMark } from '@/components/ghost/CasperMark'
import dynamic from 'next/dynamic'
import type { GhostRiveHandle } from '@/components/ghost/GhostRive'

const GhostRive = dynamic(() => import('@/components/ghost/GhostRive'), { ssr: false })

function LoginContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const ghostRef   = useRef<GhostRiveHandle>(null)
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [err,   setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setErr(decodeURIComponent(urlError))
  }, [searchParams])

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    ghostRef.current?.setState('loading')
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password: pass })
    if (error) {
      setErr(error.message); setLoading(false)
      ghostRef.current?.setState('error')
      setTimeout(() => ghostRef.current?.setState('idle'), 2000)
      return
    }
    ghostRef.current?.setState('success')
    setTimeout(() => router.push('/dashboard/humanizer'), 900)
  }

  const oauthLogin = async (provider: 'google' | 'github') => {
    const sb = createClient()
    await sb.auth.signInWithOAuth({ provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/humanizer` } })
  }

  const inputCls = "w-full bg-paper border-2 border-ink rounded-xl2 px-4 py-2.5 text-ink text-[13.5px] font-body outline-none focus:bg-paper3 transition-colors placeholder:text-mute"
  const labelCls = "block eyebrow text-[10px] text-mute mb-1.5"

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT BRAND PANEL */}
      <div className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden
        bg-blue text-paper border-r-2 border-ink">
        <img src="/casper.png"
          className="absolute -bottom-10 -right-10 w-64 h-64 object-contain opacity-[0.14] pointer-events-none casper-float" alt="" />
        <div>
          <CasperMark tone="paper" href="/" size={38} textSize={20} className="mb-16" />
          <h2 className="font-display font-semibold text-[clamp(26px,3vw,38px)] leading-[1.04] tracking-[-0.02em] mb-4">
            Invisible craft.<br />
            <span className="mark-coral px-1">Visible results.</span>
          </h2>
          <p className="text-paper/80 text-[14px] leading-relaxed mb-10 max-w-xs">
            Write in your own authentic voice — and see exactly how your text reads
            against AI detectors before you ever submit it. lowkey a cheat code.
          </p>
          <div className="flex justify-center my-6">
            <GhostRive ref={ghostRef} width={180} height={180} initialState="idle" />
          </div>
          <div className="flex flex-col gap-3">
            {[['Live','AI-score gauge'],['6','Detectors modelled'],['DOI','Verified citations']]
              .map(([v,l]) => (
              <div key={l} className="flex items-center gap-3 px-4 py-3 rounded-xl2 bg-paper/10 border-2 border-paper/25">
                <span className="font-mono font-semibold text-[16px] text-sun w-14 shrink-0">{v}</span>
                <span className="text-paper/85 text-[12px] font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <span className="sticker sticker-paper tilt-l w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-coral animate-blink" />
          built for african students &amp; pros
        </span>
      </div>

      {/* RIGHT AUTH PANEL */}
      <div className="flex flex-col justify-center px-8 md:px-16 py-12 bg-paper relative">
        <div className="max-w-sm mx-auto w-full">
          {/* Mobile logo */}
          <CasperMark tone="ink" href="/" size={32} textSize={18} className="mb-8 md:hidden" />

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-paper2 rounded-full border-2 border-ink mb-7">
            <Link href="/login"
              className="flex-1 py-2 text-center font-mono font-semibold text-[13px] rounded-full bg-ink text-paper">Sign in</Link>
            <Link href="/register"
              className="flex-1 py-2 text-center font-mono font-semibold text-[13px] text-ink2 hover:text-ink transition-colors">Create account</Link>
          </div>

          {err && (
            <div className="px-4 py-3 rounded-xl2 bg-coral/15 border-2 border-ink text-ink text-[13px] font-medium mb-4">{err}</div>
          )}

          {/* OAuth */}
          <div className="flex gap-2 mb-4">
            {(['google','github'] as const).map(p => (
              <button key={p} onClick={() => oauthLogin(p)}
                className="btn flex-1 gap-2 py-2.5 text-[12.5px] bg-paper3 text-ink hover:bg-paper2">
                {p === 'google' ? <GoogleIcon /> : <GitHubIcon />} {p[0].toUpperCase()+p.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 my-4 text-mute text-xs font-mono">
            <div className="flex-1 h-0.5 bg-ink/15" />or sign in with email<div className="flex-1 h-0.5 bg-ink/15" />
          </div>

          <form onSubmit={doLogin} className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className={inputCls} placeholder="you@example.com" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="eyebrow text-[10px] text-mute">Password</label>
                <span className="text-[11.5px] text-blue font-semibold cursor-pointer hover:underline">Forgot?</span>
              </div>
              <div className="relative">
                <input type={showPass?'text':'password'} value={pass} onChange={e => setPass(e.target.value)}
                  className={inputCls + ' pr-11'} placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors">
                  {showPass ? <EyeClosed className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn btn-primary mt-2 w-full py-3 text-[14px] rounded-full disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-ink2 text-[12.5px] font-medium mt-5">
            No account?{' '}
            <Link href="/register" className="text-blue font-semibold hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <LoginContent />
    </Suspense>
  )
}
